/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { MoonClient, getQueryId, ILink, MutateType } from "@decathlon/moon";

export interface IMock {
  query: {
    source: string;
    endPoint: string;
    variables?: any;
    type?: MutateType;
  };
  result?: () => Partial<AxiosResponse>;
  error?: Error;
}

export interface IMocks {
  [queryId: string]: IMock;
}

const getMocksByIds = (mocks: IMock[]): IMocks => {
  return mocks.reduce<IMocks>((result, mock) => {
    const { source, endPoint, variables, type } = mock.query;
    const typedEndpoint = `${endPoint}${type || ""}`;
    const queryId = getQueryId(undefined, source, typedEndpoint, variables || {});
    // eslint-disable-next-line no-param-reassign
    result[queryId] = mock;
    return result;
  }, {});
};

class MockedMoonClient extends MoonClient {
  private readonly mocks: IMocks;

  constructor(links: ILink[], mocks: IMock[]) {
    super(links);
    this.mocks = getMocksByIds(mocks);
  }

  public getClients = () => {
    // @ts-ignore
    return this.clients;
  };

  public getClient = (source: string) => {
    const clients = this.getClients();
    return clients[source];
  };

  public clearMockedClients = () => {
    const clients = this.getClients();
    Object.keys(clients).forEach(source => {
      clients[source].clearMock();
    });
  };

  public query = async (
    source: string,
    endPoint: string,
    variables: any = {},
    deserialize?: (response: any) => any,
    options: AxiosRequestConfig = {}
  ) => {
    const clients = this.getClients();
    const client = clients[source];
    const queryId = getQueryId(undefined, source, endPoint, variables);
    const mock = this.mocks[queryId];
    let response;
    if (client && mock) {
      const { result, error } = mock;
      client.get(endPoint, {
        ...options,
        params: { ...variables }
      });
      if (error) {
        throw error;
      } else if (result) {
        response = await Promise.resolve(result());
        response = deserialize ? deserialize(response) : response;
      }
    }
    return response;
  };

  public mutate = async (
    source: string,
    endPoint: string,
    type: MutateType = MutateType.Post,
    variables: any = {},
    options: AxiosRequestConfig = {}
  ) => {
    const clients = this.getClients();
    const client = clients[source];
    const typedEndpoint = `${endPoint}${type}`;
    const queryId = getQueryId(undefined, source, typedEndpoint, variables);
    const mock = this.mocks[queryId];
    let response;

    if (client && mock) {
      const { result, error } = mock;
      switch (type) {
        case MutateType.Delete:
          {
            const mutationOptions: AxiosRequestConfig = { ...options, params: { ...variables } };
            client.delete(endPoint, mutationOptions);
          }
          break;

        case MutateType.Put:
          client.put(endPoint, variables, options);
          break;

        default:
          client.post(endPoint, variables, options);
          break;
      }

      if (error) {
        throw error;
      } else if (result) {
        const mockedResponse = result();
        const axiosResponse: AxiosResponse<any> = {
          status: 200,
          config: {},
          headers: {},
          statusText: "",
          data: undefined,
          ...mockedResponse
        };
        response = await Promise.resolve(axiosResponse);
      }
    }

    return response;
  };
}

export default MockedMoonClient;

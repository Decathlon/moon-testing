/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */

import StaticAxios from "axios";

jest.unmock("axios");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Axios = require("axios");

export class AxiosClient {
  public get: jest.Mock<any, any> = jest.fn();

  public post: jest.Mock<any, any> = jest.fn();

  public delete: jest.Mock<any, any> = jest.fn();

  public put: jest.Mock<any, any> = jest.fn();

  public baseUrl = "";

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.clearMock();
  }

  public clearMock = () => {
    this.get = jest.fn();
    this.post = jest.fn();
    this.delete = jest.fn();
    this.put = jest.fn();
  };

  interceptors = {
    request: { use: () => undefined }
  };
}

export function mockAxiosClientConstructor(ClientFactory = AxiosClient): void {
  Axios.create = ({ baseUrl }) => {
    return new ClientFactory(baseUrl);
  };
}

mockAxiosClientConstructor(AxiosClient);

export const cancelToken = { cancel: () => jest.fn() };

StaticAxios.CancelToken.source = () => cancelToken;

export { default as MoonClient } from "./moon-client";
export * from "./moon-client";

export { default as MockedMoonProvider } from "./moon-provider";
export * from "./moon-provider";

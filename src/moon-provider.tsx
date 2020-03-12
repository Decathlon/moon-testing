/* eslint-disable import/no-extraneous-dependencies */
import * as React from "react";
import { Store, getMoonStore, ILink, Queries } from "@decathlon/moon";
import { MoonContext } from "@decathlon/moon/dist/moon-provider";

import MockedMoonClient, { IMock } from "./moon-client";

interface IMoonProviderProps {
  links: ILink[];
  initialStore?: Queries;
  children: JSX.Element;
  mocks: IMock[];
}

export default class MockedMoonProvider extends React.Component<IMoonProviderProps> {
  readonly client: MockedMoonClient;

  readonly store: Store;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links, initialStore, mocks } = this.props;
    this.store = getMoonStore(initialStore);
    this.client = new MockedMoonClient(links, mocks);
  }

  render() {
    const { children } = this.props;
    return <MoonContext.Provider value={{ client: this.client, store: this.store }}>{children}</MoonContext.Provider>;
  }
}

# @decathlon/moon-testing

The **@decathlon/moon-testing** package exports a MockedMoonProvider component which simplifies the testing of React components by mocking calls to the API endpoints. This allows the tests to be run in isolation and provides consistent results on every run by removing the dependence on remote data.

By using this MockedMoonProvider component, it's possible to specify the exact results that should be returned for a certain query using the mocks prop.

## Installation

```bash
npm install @decathlon/moon-testing --save-dev
```

## Usage

You get started by create REST links. A link is an object which need an id and a baseUrl of your REST server.

To connect Moon to your React app, you will need to use the MockedMoonProvider component exported from `@decathlon/moon-testing`. The MockedMoonProvider is a React's Context.Provider. It wraps your React app and places the client on the context, which allows you to mock calls to the API endpoint.

```js
import * as React from "react";
import { render, wait } from "@testing-library/react";
import { Query } from "@decathlon/moon";
import { IMock, MockedMoonProvider } from "@decathlon/moon-testing";

interface QueryData {
  data: {
    users: { id: number; name: string }[];
  };
}

interface QueryVariables {
  foo: string;
}

const links = [{ id: "FOO", baseUrl: "url", interceptors: {} }];

const mocks: IMock[] = [
  {
    query: {
      source: "FOO",
      endPoint: "/users",
      variables: { foo: "bar" }
    },
    // result or error: new Error("Bim!")
    // result : () => Partial<AxiosResponse>
    result: () => ({
      data: {
        users: [{ id: 1, name: "John Smith" }]
      }
    })
  }
];

describe("Query component with MockedMoonProvider", () => {
  test("should render the list of users", async () => {
    const { container, getByText } = render(
      <MockedMoonProvider links={links} mocks={mocks}>
        <Query<QueryData, QueryVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ data }) => {
            return data
              ? data.data.users.map(user => {
                  return <span>{user.name}</span>;
                })
              : null;
          }}
        </Query>
      </MockedMoonProvider>
    );
    await wait(() => container.querySelector("span"));
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
  });
});

```


## Getting Started (Devs)

```bash
git clone ...
cd moon-testing
npm ci
```

## Running the tests

```bash
npm run test
```

## Contributing

**PRs are welcome!**
You noticed a bug, a possible improvement or whatever?
Any help is always appreciated, so don't hesitate opening one!

Be sure to check out the [contributing guidelines](CONTRIBUTING.md) to fasten
up the merging process.

See also the list of [contributors](https://github.com/Decathlon/moon-testing/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE.md](https://github.com/Decathlon/moon-testing/blob/master/LICENSE) file for details

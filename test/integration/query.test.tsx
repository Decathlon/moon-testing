/* eslint-disable max-classes-per-file */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { render, wait, fireEvent } from "@testing-library/react";
import { Query, Mutation, MutateType } from "@decathlon/moon";

import { IMock } from "../../src/moon-client";
import { MockedMoonProvider } from "../../src";

interface QueryData {
  data: {
    users: { id: number; name: string }[];
  };
}

interface CommentsQueryData {
  data: {
    comments: { id: number; text: string }[];
  };
}

interface MutationResponse {
  status: 200;
}

interface QueryVariables {
  foo: string;
}

interface CommentsQueryVariables {
  user: number;
}

const links = [{ id: "FOO", baseUrl: "url", interceptors: {} }];

const mocks: IMock[] = [
  {
    query: {
      source: "FOO",
      endPoint: "/users",
      variables: { foo: "bar" }
    },
    result: () => ({
      data: {
        users: [{ id: 1, name: "John Smith" }]
      }
    })
  },
  {
    query: {
      source: "FOO",
      endPoint: "/comments",
      variables: { user: 1 }
    },
    result: () => ({
      data: {
        comments: [{ id: 1, text: "My comment" }]
      }
    })
  },
  {
    query: {
      source: "FOO",
      endPoint: "/users",
      type: MutateType.Post,
      variables: { foo: "bar" }
    },
    result: () => ({
      status: 200
    })
  }
];

describe("Query component with MoonProvider", () => {
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
    expect(container.querySelectorAll("span")).toHaveLength(0);
    await wait(() => container.querySelector("span"));
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
  });

  test("should render the list of comments with sequential queries", async () => {
    const { container, getByText } = render(
      <MockedMoonProvider links={links} mocks={mocks}>
        <Query<QueryData, QueryVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ data: usersData }) => {
            if (!usersData) {
              return <div>Loading...</div>;
            }
            return (
              <Query<CommentsQueryData, CommentsQueryVariables>
                source="FOO"
                endPoint="/comments"
                variables={{ user: usersData.data.users[0].id }}
              >
                {({ data: commentsData }) => {
                  return commentsData
                    ? commentsData.data.comments.map(comment => {
                        return <span>{comment.text}</span>;
                      })
                    : null;
                }}
              </Query>
            );
          }}
        </Query>
      </MockedMoonProvider>
    );
    expect(container.querySelectorAll("span")).toHaveLength(0);
    await wait(() => container.querySelector("span"));
    expect(getByText(/My comment/)).toBeTruthy();
  });

  test("should call the mutate action", async () => {
    const { container, getByText } = render(
      <MockedMoonProvider links={links} mocks={mocks}>
        <Mutation<MutationResponse, QueryVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ actions: { mutate }, response }) => {
            return response && response.status ? (
              <span>Success</span>
            ) : (
              <button id="button" onClick={mutate} type="button">
                Go
              </button>
            );
          }}
        </Mutation>
      </MockedMoonProvider>
    );

    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await wait(() => container.querySelector("span"));

    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/Success/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);
  });

  test("should call the mutate action with error", async () => {
    const mocks: IMock[] = [
      {
        query: {
          source: "FOO",
          endPoint: "/users",
          type: MutateType.Post,
          variables: { foo: "bar" }
        },
        error: new Error("My Error")
      }
    ];

    const { container, getByText } = render(
      <MockedMoonProvider links={links} mocks={mocks}>
        <Mutation<MutationResponse, QueryVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ actions: { mutate }, response, error }) => {
            if (error) {
              return <div>{error.message}</div>;
            }

            return response && response.status ? (
              <span>Success</span>
            ) : (
              <button id="button" onClick={mutate} type="button">
                Go
              </button>
            );
          }}
        </Mutation>
      </MockedMoonProvider>
    );

    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await wait(() => container.querySelector("span"));

    expect(getByText(/My Error/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);
  });
});

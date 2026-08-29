import { gql } from "@apollo/client";
import type { User } from "./types";
import { useEffect } from "react";

type Props = {
  readonly user: User;
  readonly users: readonly User[];
};

const countryOptions = ["Canada", "France"] as const;

const compareUsers = (a: User, b: User) => a.name.localeCompare(b.name);

function UserBadge({ name }: { readonly name: string }) {
  return <strong>{name}</strong>;
}

function UserRow({ user }: { readonly user: User }) {
  return <li>{user.name}</li>;
}

function CloseIcon() {
  return <svg aria-hidden="true" />;
}

function normalize(items: readonly User[] = []) {
  return items;
}

function parse(value: string) {
  return Number.parseInt(value, 10);
}

function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "name" in value;
}

async function loadUser(response: Response): Promise<User> {
  const raw: unknown = await response.json();

  if (!isUser(raw)) {
    throw new Error("Invalid user response");
  }

  return raw;
}

export function Dashboard({ user, users }: Props) {
  const activeUser = user;
  const city = user?.address?.city;
  const sortedUsers = users.toSorted(compareUsers);

  useEffect(() => {
    console.log(user.id);
  }, [user.id]);

  const query = gql`
    query UserQuery($userId: ID!) {
      user(id: $userId) {
        id
      }
    }
  `;

  return (
    <section>
      <button type="button">Open menu</button>

      <button type="button" aria-label="Close menu">
        <CloseIcon />
      </button>

      <ul>
        {sortedUsers.map((item) => (
          <UserRow key={item.id} user={item} />
        ))}
      </ul>

      <p>{city}</p>
      <p>{countryOptions.join(", ")}</p>
      <p>{activeUser.name}</p>
      <UserBadge name={activeUser.name} />
      <pre>{query.loc?.source.body}</pre>
    </section>
  );
}

void normalize;
void parse;
void loadUser;

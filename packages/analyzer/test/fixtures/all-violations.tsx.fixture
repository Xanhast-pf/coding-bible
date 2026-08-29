import { gql } from "@apollo/client";
import { observer } from "@legendapp/state/react";
import { useEffect } from "react";
import { User } from "./types";

type Props = {
  user: User;
  users: User[];
};

const compareUsers = (a: User, b: User) => a.name.localeCompare(b.name);
const openMenu = () => {};

function UserBadge({ name }: { name: string }) {
  return <strong>{name}</strong>;
}

function UserRow({ user }: { user: User }) {
  return <li>{user.name}</li>;
}

const CloseIcon = () => <svg />;
const ObservedName = observer(() => <span>{store$.name.get()}</span>);

function normalize(items?: User[]) {
  items = items ?? [];
  return items;
}

function parse(value: any) {
  return parseInt(value, 10);
}

async function loadUser(response: Response) {
  const raw = await response.json();
  return raw as User;
}

export function Dashboard({ user, users }: Props) {
  let activeUser = user;
  const city = user && user.address && user.address.city;
  const sortedUsers = users.sort(compareUsers);
  const options = ["Canada", "France"];

  user.name = user.name.trim();

  if (user.active) {
    useEffect(() => {
      console.log(user.id);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  }

  const query = gql`
    query UserQuery {
      user(id: "${user.id}") {
        id
      }
    }
  `;

  const badge = UserBadge({ name: activeUser.name });

  return (
    <section>
      <div onClick={openMenu}>Open menu</div>

      <div role="button" tabIndex={0} onClick={openMenu}>
        Custom button
      </div>

      <button type="button">
        <CloseIcon />
      </button>

      <ul>
        {users.map((item) => (
          <UserRow user={item} />
        ))}

        {sortedUsers.map((item, index) => (
          <UserRow key={`row-${index}`} user={item} />
        ))}
      </ul>

      <p>{city}</p>
      <p>{options.join(", ")}</p>
      <p>{String(query)}</p>
      {badge}
      <ObservedName />
    </section>
  );
}

void normalize;
void parse;
void loadUser;

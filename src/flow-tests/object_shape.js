// // @flow

// type User = {
//     id: number,
//     username: string,
//     isAdmin?: boolean,
// };

// function requireAdmin(user: User): boolean {
//     return user.isAdmin === true;
// }

// const raw: any = { id: '42', username: 123 };
// // Intentional errors: wrong property types
// // $FlowExpectedError[incompatible-type]
// const notAUser: User = raw;
// // $FlowExpectedError[incompatible-call]
// const admin = requireAdmin({ id: '1', username: 'alice' });

// // Correct example
// const okUser: User = { id: 1, username: 'bob', isAdmin: false };
// const isAdmin = requireAdmin(okUser);
// console.log(isAdmin);



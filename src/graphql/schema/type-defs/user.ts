import { gql } from 'apollo-server-express';

export default gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    status: Status!
    createdAt: String!
    updatedAt: String!
  }

  enum Role {
    ADMIN
    USER
  }

  enum Status {
    ACTIVE
    INACTIVE
  }

  type Query {
    getUserById(userId: ID!): User
  }

  type Mutation {
    registerUser(
      email: String!
      name: String!
      password: String!
      role: Role
    ): User!
  }
`;

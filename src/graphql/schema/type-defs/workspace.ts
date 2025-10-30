import { gql } from 'graphql-tag';

export default gql`
  type Workspace {
    id: String!
    name: String!
    description: String
    createdBy: String!
    createdAt: String!
    updatedAt: String!
    deletedAt: String
  }

  enum WorkspaceRole {
    OWNER
    MEMBER
    VIEWER
  }

  type WorkspaceMembership {
    id: String!
    workspaceId: String!
    role: WorkspaceRole!
    email: String!
  }

  type Query {
    getWorkspace(id: ID!): Workspace
    #   getAllWorkspaces: [Workspace!]!
  }

  type Mutation {
    createWorkspace(name: String!, description: String): Workspace!
    # updateWorkspace(id: ID!, name: String!, description: String): Workspace!
    # deleteWorkspace(id: ID!): Boolean!
    addWorkspaceMember(
      workspaceId: ID!
      email: String!
      role: WorkspaceRole!
    ): WorkspaceMembership!
    # removeWorkspaceMember(workspaceId: ID!, userId: ID!): Boolean!
    # updateWorkspaceMemberRole(
    #   workspaceId: ID!
    #   userId: ID!
    #   role: WorkspaceRole!
    # ): WorkspaceMembership!
  }
`;

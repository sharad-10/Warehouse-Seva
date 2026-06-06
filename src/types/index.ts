export type SpaceRole = "admin" | "edit" | "view";

export type FieldType = "text" | "number" | "date" | "datetime" | "currency" | "alert";

export interface CardField {
  id: string;
  label: string;
  type: FieldType;
  value: string | null;
}

export interface Card {
  id: string;
  spaceId: string;
  name: string;
  fields: CardField[];
  createdAt: string;
}

export interface Space {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface SpaceMember {
  id: string;
  uid: string;
  spaceId: string;
  username: string;
  email: string;
  role: SpaceRole;
}

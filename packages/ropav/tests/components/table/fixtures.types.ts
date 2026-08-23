export interface TableFixtureUser {
  id: number;
  name: string;
  role: string;
  email: string;
}

export interface TableFixtureResizableColumn {
  id: string;
  name: string;
  defaultWidth?: number | string;
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  withResizer?: boolean;
}

export interface OidcScope {
  scope?: string;
}

export interface OidcScopeId extends OidcScope {
  sub: string;
  scope?: 'openid';
}

export interface OidcScopeProfile extends OidcScope {
  name: string;
  given_name: string;
  family_name: string;
  scope?: 'profile';
}

export interface OidcScopeGroups extends OidcScope {
  memberof: Record<string, string[]>;
  scope?: 'groups';
}

export interface OidcScopePicture extends OidcScope {
  jpegPhoto: string;
  scope?: 'picture';
}

export interface OidcScopeMail extends OidcScope {
  mail?: string;
  email?: string;
  scope?: 'email';
}

export interface OidcScopeAdvProfile extends OidcScope {
  privDepartmentCode: string;
  manager: string;
  ou: string;
  cn: string;
  privbusinesscategorycode: string;
  title: string;
  employeeNumber: string;
  uid: string;
  employeeType: string;
  businesscategory: string;
  privContractEndDate: string;
  privContractStartDate: string;
  preferredlanguage: string;
  departmentnumber: string;
  privAccountStatus: string;
  scope?: 'advprofile';
}

export type OidcScopeAll = OidcScopeId &
  OidcScopeProfile &
  OidcScopeGroups &
  OidcScopePicture &
  OidcScopeMail &
  OidcScopeAdvProfile;

export type OidcUserInfo<T extends string | OidcScope = OidcScopeAll> =
  T extends OidcScopeId['scope']
    ? OidcScopeId
    : T extends OidcScopeProfile['scope']
      ? OidcScopeProfile
      : T extends 'groups'
        ? OidcScopeGroups['scope']
        : T extends OidcScopePicture['scope']
          ? OidcScopePicture
          : T extends OidcScopeMail['scope']
            ? OidcScopeMail
            : T extends OidcScopeAdvProfile['scope']
              ? OidcScopeAdvProfile
              : T extends `${infer A} ${infer B}`
                ? OidcUserInfo<A> & OidcUserInfo<B>
                : T extends OidcScope
                  ? T
                  : never;

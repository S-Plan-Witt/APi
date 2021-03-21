# Moodle Integration


## Requirements
- SSL with valid public root certificate chain
- Moodle with administration privileges

## ActiveDirectory

Site Administration -> Plugins -> LDAP
- Host URL: LDAP_HOST from API
- Distinguished name: Full dn for the service user
- UserType: "MS ActiveDirectory"
- Context: LDAP_ROOT
- User attribute: "samaccountname"
- Member attribute: "memberOf"
- Course creator context: LDAP_TEACHERGROUP
- Removed ext user: "Suspend internal"

Site Administration -> Plugins

- Prevent account creation when authenticating: Checked

## Api user

- Create a new confirmed user
- Import a new Role (resources/apiRole.xml)
- Assign the new role to the new user


## Web services
Site Administration -> Plugins -> Web services

1. Enable web services: Checked
2. Enable protocols: REST protocol
5. Select a service: Create a new one (Enabled, authorized users)
6. Add functions:
    - core_user_create_users
    - core_user_delete_users
    - core_user_get_users
    - core_user_get_users_by_field
7. Select a specific user: the user from above
8. Create a token: Use the api user and the new service
    -> Save the token in the api configuration
    
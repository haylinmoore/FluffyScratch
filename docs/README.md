# FluffyScratch Documentation

Below is the sorted documentation for FluffyScratch

# /Auth

## Starting Authentication

Send a user to this page to start the authentication processs, afterwhich they will be redirect to the redirect location with the following query parameters, username, publicCode, privateCode, redirectLocation.

**URL** : `/auth/getKeys/v2?redirect=:redirectLocation`

## Notes

-   The user should be redirected to this page, this is not a backend request path
-   redirectLocation should be passed as a base64 encoded version of the redirectLocation
-   redirectLocation should not include the protocol as HTTPS is assumed, for example it should be the base64 of "fluffyscratch.hampton.pw/auth/test" which would become "Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvdGVzdA"

## Verify Authentication

After the client authenticates, they will be redirected to your site, to verify the authentication was correct use this path.

**URL** : `/auth/verify/v2/:privateCode`

**Method** : `GET`

**Content examples**

Authentication Successful

```json
{
  "valid": true,
  "username": "herohamp",
  "redirect": "fluffyscratch.hampton.pw/auth/test"
}
```

Authentication Failure

```json
{
  "valid": false,
  "username": null,
  "redirect": null
}
```

## Notes

-   Each public and private code pair can only be used once
-   Private keys are only valid for 5 minutes 

// /.well-known/* endpoints. These are static RFC 8615-style metadata
// files that improve security posture and help crawlers and tooling.
//
//   /.well-known/security.txt  — RFC 9116. Tells researchers how to
//                                report vulnerabilities.
//   /.well-known/change-password — W3C. Tells password managers the
//                                password change URL.
//   /.well-known/robots.txt    — Same as /robots.txt, but at the
//                                canonical well-known path.
// CloudFront Function (événement « viewer request ») de la distribution SSG.
// nuxt generate écrit /pokemon/25/index.html, mais S3 (accès privé via OAC) ne résout pas
// les dossiers : sans cette réécriture, /pokemon/25 renverrait une erreur.
// Runtime cloudfront-js-2.0 : JS limité, pas de modules ni d'accès réseau.
// eslint-disable-next-line no-unused-vars -- appelée par CloudFront, qui interdit les export
function handler(event) {
  var request = event.request
  var uri = request.uri

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html'
  } else if (!uri.split('/').pop().includes('.')) {
    // Pas d'extension : c'est une page, pas un fichier (_nuxt/xxx.js, favicon.ico…)
    request.uri = uri + '/index.html'
  }
  return request
}

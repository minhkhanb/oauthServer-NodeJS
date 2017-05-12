var App = {};
App.authenticate = function () {
    console.log('authenticate');
}
App.init = function () {
    App.authenticate();
}
window.addEventListener('load', App.init);
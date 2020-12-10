var deferredPrompt;
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function() {
            console.log("Service worker зарегистрирован!");
        })
}
window.addEventListener("beforeinstallprompt", function(event)
{
    console.log("beforeinstallprompt отменен");
    event.preventDefault();
    deferredPrompt = event;
    return false;
});
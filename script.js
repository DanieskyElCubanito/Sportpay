function copyRef() {
    const copyText = document.getElementById("ref-link");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    // Feedback visual (puedes usar un alert o un toast)
    alert("¡Enlace copiado!");
}

// Esta función se activaría cuando conectemos el Bot para mostrar quiénes están en cada nivel
function viewLevel(n) {
    console.log("Viendo detalles del Nivel " + n);
    // Aquí podrías abrir un modal con la lista de IDs de ese nivel
}

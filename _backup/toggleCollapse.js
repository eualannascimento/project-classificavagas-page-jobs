const myApp = (() => {
    // Function to toggle the collapsed content
    const toggleCollapse = (event) => {
        const collapsedContent = event.currentTarget.querySelector(".collapsed-content");
        const indicatorIcon = event.currentTarget.querySelector(".indicator i");
        collapsedContent.classList.toggle("hidden");
        indicatorIcon.classList.toggle("bx-chevron-down");
        indicatorIcon.classList.toggle("bx-chevron-up");
    };

    // Function to add click event listener to elements with a specific class
    const addClickEventListenerToClass = (className, callback) => {
        const elements = document.querySelectorAll(className);
        elements.forEach(element => {
            element.addEventListener("click", callback);
        });
    };

    // Element with the specific class for collapsed content
    const collapsedDiv = document.querySelector(".p-4.bg-gray-800.rounded-lg.mb-4.cursor-pointer");
    collapsedDiv.addEventListener("click", toggleCollapse);

    // Elements with the specific class for labels
    addClickEventListenerToClass(".cursor-pointer", toggleCollapse);
})();
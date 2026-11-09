// Shared navigation dropdown

const dropdown = document.getElementById("featuresDropdown");

const dropdownButton = document.getElementById("featuresButton");

if (dropdown && dropdownButton) {

    dropdownButton.addEventListener("click", () => {

        const isOpen = dropdown.classList.toggle("open");

        dropdownButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });

    // Close when clicking outside

    document.addEventListener("click", (event) => {

        if (!dropdown.contains(event.target)) {

            dropdown.classList.remove("open");

            dropdownButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

    // Close using Escape key

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            dropdown.classList.remove("open");

            dropdownButton.setAttribute(
                "aria-expanded",
                "false"
            );

            dropdownButton.focus();

        }

    });

}
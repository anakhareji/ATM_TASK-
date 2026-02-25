export const getGreeting = (name) => {
    const hour = new Date().getHours();

    let greeting = "";

    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    return `${greeting}, ${name}`;
};

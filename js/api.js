const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";

export async function searchRecipes(query) {
    try {
        const response = await fetch(`${BASE_URL}search.php?s=${query}`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getRecipesByCategory(category) {
    try {
        const response = await fetch(`${BASE_URL}filter.php?c=${category}`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getRecipeDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}lookup.php?i=${id}`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getAllCategories() {
    try {
        const response = await fetch(`${BASE_URL}categories.php`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        return data.categories || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}
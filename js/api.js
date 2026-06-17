const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function searchRecipes(query) {
    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failure: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
}

export async function getRecipesByCategory(category) {
    const url = `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failure: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
}

export async function getRecipeDetails(id) {
    const url = `${BASE_URL}/lookup.php?i=${id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failure: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
}

export async function getAllCategories() {
    const url = `${BASE_URL}/list.php?c=list`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failure: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
}
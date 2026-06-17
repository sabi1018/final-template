import { searchRecipes, getRecipesByCategory, getRecipeDetails, getAllCategories } from './api.js';

let favoriteRecipesState = JSON.parse(localStorage.getItem('recipe_favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('search-form')) initBrowseRoute();
    if (document.getElementById('detail-card')) initDetailRoute();
    if (document.getElementById('backlog-grid')) initFavoritesRoute();
});

async function initBrowseRoute() {
    const searchForm = document.getElementById('search-form');
    const categoryFilter = document.getElementById('category-filter');
    const loader = document.getElementById('loading-indicator');
    const grid = document.getElementById('results-grid');
    const feedback = document.getElementById('search-feedback');

    try {
        loader.classList.remove('hidden');
        
        const categories = await getAllCategories();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.strCategory;
            option.textContent = cat.strCategory;
            categoryFilter.appendChild(option);
        });

        const initialMeals = await searchRecipes('');
        loader.classList.add('hidden');
        renderRecipeMatrix(initialMeals, grid);
    } catch (err) {
        loader.classList.add('hidden');
        feedback.textContent = "Unable to pre-populate database feeds.";
    }

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const queryInput = document.getElementById('search-query');
        const timeInput = document.getElementById('prep-time-limit');
        const query = queryInput.value.trim();
        const timeLimit = parseInt(timeInput.value, 10);

        feedback.textContent = "";

        if (query.length > 0 && query.length < 2) {
            feedback.textContent = "❌ Search keyword must be at least 2 characters.";
            return;
        }

        if (timeInput.value && (timeLimit < 1 || timeLimit > 180)) {
            feedback.textContent = "❌ Max minutes must be a number between 1 and 180.";
            return;
        }

        categoryFilter.value = ""; 
        executeSearch(() => searchRecipes(query));
    });

    categoryFilter.addEventListener('change', async (e) => {
        const selectedCategory = e.target.value;
        document.getElementById('search-query').value = ""; 
        document.getElementById('prep-time-limit').value = "";
        feedback.textContent = "";

        if (!selectedCategory) {
            executeSearch(() => searchRecipes(''));
        } else {
            executeSearch(() => getRecipesByCategory(selectedCategory));
        }
    });

    async function executeSearch(apiCall) {
        grid.innerHTML = '';
        feedback.textContent = '';
        loader.classList.remove('hidden');
        try {
            const results = await apiCall();
            loader.classList.add('hidden');
            if (results.length === 0) {
                feedback.textContent = "No entries found matching criteria.";
            } else {
                renderRecipeMatrix(results, grid);
            }
        } catch (error) {
            loader.classList.add('hidden');
            feedback.textContent = `❌ Network Connection Error: ${error.message}`;
        }
    }
}

function renderRecipeMatrix(meals, grid) {
    grid.innerHTML = '';
    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card'; 
        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-img">
            <div class="card-content">
                <div>
                    <h3>${meal.strMeal}</h3>
                    <span class="category-tag">${meal.strCategory || 'Delicious'}</span>
                </div>
                <button class="btn btn-outline view-details-btn">View Recipe</button>
            </div>
        `;

        const viewBtn = card.querySelector('.view-details-btn');
        viewBtn.addEventListener('click', () => {
            localStorage.setItem('active_recipe_id', meal.idMeal);
            window.location.href = 'quiz.html'; 
        });

        grid.appendChild(card);
    });
}

async function initDetailRoute() {
    const mealId = localStorage.getItem('active_recipe_id');
    const loader = document.getElementById('loading-indicator');
    const detailCard = document.getElementById('detail-card');
    const errorBox = document.getElementById('error-message');

    if (!mealId) {
        loader.classList.add('hidden');
        errorBox.classList.remove('hidden');
        return;
    }

    try {
        const meal = await getRecipeDetails(mealId);
        loader.classList.add('hidden');
        detailCard.classList.remove('hidden');

        const isSaved = favoriteRecipesState.some(m => m.id === meal.idMeal);

        let ingredientsHtml = '';
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== "") {
                ingredientsHtml += `<li><strong>${measure}</strong> ${ingredient}</li>`;
            }
        }

        detailCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="detail-hero-img">
            <h2>${meal.strMeal}</h2>
            <span class="category-tag detail-status-tag">Category: ${meal.strCategory}</span>
            
            <div class="ingredients-box">
                <h3>📋 Required Ingredients</h3>
                <ul>${ingredientsHtml}</ul>
            </div>

            <div class="instructions-box">
                <h3>📖 Cooking Instructions</h3>
                <p>${meal.strInstructions}</p>
            </div>
            
            <button id="toggle-favorite-btn" class="btn ${isSaved ? 'btn-danger' : 'btn-primary'} direct-full-width">
                ${isSaved ? '❌ Remove from Watchlist' : '⭐ Add to Watchlist'}
            </button>
        `;

        const toggleBtn = document.getElementById('toggle-favorite-btn');
        toggleBtn.addEventListener('click', () => {
            const existingIdx = favoriteRecipesState.findIndex(m => m.id === meal.idMeal);
            if (existingIdx >= 0) {
                favoriteRecipesState.splice(existingIdx, 1);
                toggleBtn.textContent = '⭐ Add to Watchlist';
                toggleBtn.className = 'btn btn-primary direct-full-width';
            } else {
                favoriteRecipesState.push({
                    id: meal.idMeal,
                    name: meal.strMeal,
                    image: meal.strMealThumb,
                    category: meal.strCategory
                });
                toggleBtn.textContent = '❌ Remove from Watchlist';
                toggleBtn.className = 'btn btn-danger direct-full-width';
            }
            localStorage.setItem('recipe_favorites', JSON.stringify(favoriteRecipesState));
        });

    } catch (err) {
        loader.classList.add('hidden');
        errorBox.classList.remove('hidden');
    }
}

function initFavoritesRoute() {
    const grid = document.getElementById('backlog-grid');
    grid.innerHTML = '';

    if (favoriteRecipesState.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'direct-full-width text-center color-muted grid-span-all';
        emptyMsg.textContent = 'Your culinary watchlist is empty. Go save some favorites!';
        grid.appendChild(emptyMsg);
        return;
    }

    favoriteRecipesState.forEach((meal, index) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${meal.image}" alt="${meal.name}" class="recipe-img">
            <div class="card-content">
                <div>
                    <h3>${meal.name}</h3>
                    <span class="category-tag">${meal.category}</span>
                </div>
                <div class="recipe-card-actions">
                    <button class="btn btn-outline view-details-btn direct-full-width">View Directions</button>
                    <button class="btn btn-danger remove-btn direct-full-width">Delete</button>
                </div>
            </div>
        `;

        card.querySelector('.view-details-btn').addEventListener('click', () => {
            localStorage.setItem('active_recipe_id', meal.id);
            window.location.href = 'quiz.html';
        });

        card.querySelector('.remove-btn').addEventListener('click', () => {
            favoriteRecipesState.splice(index, 1);
            localStorage.setItem('recipe_favorites', JSON.stringify(favoriteRecipesState));
            initFavoritesRoute(); 
        });

        grid.appendChild(card);
    });
}
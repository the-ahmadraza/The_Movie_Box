// TMDb API Configuration
const API_KEY = '8de1100a9c43b599f84e99ace341beee'; // Your TMDb API key
const READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGUxMTAwYTljNDNiNTk5Zjg0ZTk5YWNlMzQxYmVlZSIsIm5iZiI6MTc1NDgwODcwOS40MDcsInN1YiI6IjY4OTg0MTg1YzY5ZjA1MTUxZTI2NzlmNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5jDwUVXJCx1DHGhl5GrYWYEqotqB6p6yzhS3Aj6l0W8'; // Your Read Access Token

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Helper function to make API requests
async function makeAPIRequest(endpoint) {
    const fullUrl = `${BASE_URL}${endpoint}`;
    
    // Add the API key to the URL if it's not already there
    const urlWithKey = new URL(fullUrl);
    if (!urlWithKey.searchParams.has('api_key')) {
         urlWithKey.searchParams.append('api_key', API_KEY);
    }

    try {
        const response = await fetch(urlWithKey.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${READ_ACCESS_TOKEN}`
            }
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(`Failed to fetch data: ${errorData.status_message || response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Re-throw the error to be caught by the calling function
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Add active class to current nav link
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load content for specific pages
    if (pageId === 'top-movies') {
        loadTopMovies();
    } else if (pageId === 'home') {
        loadTrendingMovies();
    }
}

// Load trending movies for homepage
async function loadTrendingMovies() {
    const container = document.getElementById('trendingMovies');
    container.innerHTML = '<div class="loading">Loading trending movies...</div>';
    
    try {
        const data = await makeAPIRequest(`/trending/movie/day`);
        
        if (data.results && data.results.length > 0) {
            displayTrendingMovies(data.results.slice(0, 10)); // Show first 10
        } else {
            throw new Error('No trending movies found');
        }
    } catch (error) {
        console.error('Error loading trending movies:', error);
        container.innerHTML = `
            <div class="error" style="text-align: center; padding: 2rem; opacity: 0.7;">
                <p>Unable to load trending movies</p>
                <button onclick="loadTrendingMovies()" class="spin-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-top: 1rem;">🔄 Retry</button>
            </div>
        `;
    }
}

function displayTrendingMovies(movies) {
    const container = document.getElementById('trendingMovies');
    
    container.innerHTML = movies.map(movie => {
        const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/150x225?text=No+Poster';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
        return `
            <div class="trending-movie" title="${movie.title} (${rating}⭐)">
                <img src="${posterUrl}" alt="${movie.title}">
                <div class="movie-overlay">
                    <div style="font-weight: bold;">${movie.title.length > 20 ? movie.title.substring(0, 17) + '...' : movie.title}</div>
                    <div>⭐ ${rating}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Quick genre navigation
function showGenre(genreId) {
    showPage('wheel');
    setTimeout(() => {
        const genreSelect = document.getElementById('genreSelect');
        genreSelect.value = genreId;
    }, 100);
}

// About function placeholder
function showAbout() {
    alert('🎬 About The Movie Box\n\nWe\'re passionate about helping movie lovers discover their next favorite film! Our platform combines the power of The Movie Database with fun, interactive tools to make movie discovery exciting and personalized.\n\n✨ Features:\n• Movie Roulette Wheel\n• Top Rated Collections\n• Trending Movies\n• Genre-based Recommendations\n\nBuilt with ❤️ for cinephiles everywhere!');
}

// Movie Wheel Functionality
async function spinWheel() {
    const spinBtn = document.getElementById('spinBtn');
    const wheel = document.getElementById('movieWheel');
    const result = document.getElementById('movieResult');
    const genreSelect = document.getElementById('genreSelect');

    // Disable button and show loading
    spinBtn.disabled = true;
    spinBtn.textContent = '🎲 Spinning...';
    result.style.display = 'none';

    // Spin animation
    const randomSpins = Math.floor(Math.random() * 3) + 3; // 3-5 full spins
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = (randomSpins * 360) + randomDegree;
    
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    try {
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get random movie
        const selectedGenre = genreSelect.value;
        const movie = await getRandomMovie(selectedGenre);
        
        if (movie) {
            displayMovieResult(movie);
        } else {
            throw new Error('No movies found for the selected criteria');
        }
    } catch (error) {
        console.error('Error getting movie:', error);
        result.innerHTML = `
            <div class="error">
                <h3>Oops! Something went wrong</h3>
                <p>Could not find a movie. Please try again.</p>
            </div>
        `;
        result.style.display = 'block';
    } finally {
        // Re-enable button
        spinBtn.disabled = false;
        spinBtn.textContent = '🎲 Spin Again!';
    }
}

async function getRandomMovie(genreId = '') {
    try {
        const randomPage = Math.floor(Math.random() * 10) + 1; // Random page 1-10
        let endpoint = `/discover/movie?sort_by=popularity.desc&page=${randomPage}&vote_average.gte=6`;
        
        if (genreId) {
            endpoint += `&with_genres=${genreId}`;
        }

        const data = await makeAPIRequest(endpoint);
        
        if (data.results && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.results.length);
            return data.results[randomIndex];
        }
        return null;
    } catch (error) {
        console.error('Error fetching random movie:', error);
        return null;
    }
}

function displayMovieResult(movie) {
    const result = document.getElementById('movieResult');
    const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster';
    
    result.innerHTML = `
        <h3>🎬 Your Movie Pick!</h3>
        <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
        <h4>${movie.title}</h4>
        <p class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}/10</p>
        <p>${movie.overview || 'No description available.'}</p>
        <p><strong>Release Date:</strong> ${movie.release_date || 'Unknown'}</p>
    `;
    result.style.display = 'block';
}

// Top Movies Functionality
async function loadTopMovies() {
    const grid = document.getElementById('topMoviesGrid');
    grid.innerHTML = '<div class="loading">Loading amazing movies...</div>';
    
    try {
        const data = await makeAPIRequest(`/movie/top_rated?page=1`);
        
        if (data.results && data.results.length > 0) {
            displayTopMovies(data.results);
        } else {
            throw new Error('No movies found');
        }
    } catch (error) {
        console.error('Error loading top movies:', error);
        grid.innerHTML = `
            <div class="error">
                <h3>Unable to load movies</h3>
                <p>Please check your internet connection and try again.</p>
                <button onclick="loadTopMovies()" class="spin-btn" style="margin-top: 1rem;">🔄 Retry</button>
            </div>
        `;
    }
}

function displayTopMovies(movies) {
    const grid = document.getElementById('topMoviesGrid');
    
    grid.innerHTML = movies.map(movie => {
        const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster';
        
        return `
            <div class="movie-card">
                <img src="${posterUrl}" alt="${movie.title}">
                <div class="movie-card-info">
                    <h4>${movie.title}</h4>
                    <div class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}</div>
                    <p>${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
                    <p class="movie-card-overview">${movie.overview}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });

    // Load trending movies on homepage
    loadTrendingMovies();

    console.log('🎬 The Movie Box - Your Ultimate Movie Destination Loaded!');
    console.log('Ready to discover amazing movies! 🍿');
});

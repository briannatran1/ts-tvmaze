import jQuery, { param } from 'jquery';

const $ = jQuery;

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

const TV_MAZE_BASE_URL = "https://api.tvmaze.com/";
const DEFAULT_IMAGE_URL = "https://tinyurl.com/tv-missing";

interface ShowInterface {
  id: number;
  name: string;
  summary: string;
  image: string;
}

interface EpisodeInterface {
  id: number;
  name: string;
  season: string;
  number: string;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
*/

async function searchShowsByTerm(term: string): Promise<[]> {
  const params = new URLSearchParams({ q: term });

  const res = await fetch(`${TV_MAZE_BASE_URL}search/shows/?${params}`);
  const shows: any = await res.json();

  const collectedShows: any = [];

  for (let tvShow of shows) {
    let show: ShowInterface = {
      id: tvShow.show.id,
      name: tvShow.show.name,
      summary: tvShow.show.summary,
      image: tvShow.show.image?.original || DEFAULT_IMAGE_URL
    };

    collectedShows.push(show);
  }

  return collectedShows;
}

/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: any[]) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
          <img
            src="${show.image}"
            alt="${show.name}"
            class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}

/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val();
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: string): Promise<[]> {
  const res = await fetch(`${TV_MAZE_BASE_URL}shows/${id}/episodes`);
  const episodeData: any = await res.json();

  const episodes = episodeData.map((episode: EpisodeInterface) =>
  ({
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number
  }));
  return episodes;
}

/** Given an episodes array, create a list item for each episode object and
 * display list of episodes on DOM.
*/
function populateEpisodes(episodes: any[]) {
  $("#episodesList").empty();
  for (const episode of episodes) {
    $("#episodesList").append(`<li>${episode.name} (season ${episode.season}, number ${episode.number})</li>`);
  }

  $episodesArea.show();
}

/** Handle click on episodes button: get episodes for show and display */
async function handleAndPopulateEpisodes(target: {}): Promise<void> {
  const showID = $(target).closest('.Show').attr('data-show-id');

  const episodes = await getEpisodesOfShow(showID);
  populateEpisodes(episodes);
}

$showsList.on('click', '.Show-getEpisodes', async function (e) {
  e.preventDefault();
  await handleAndPopulateEpisodes(e.target);
});
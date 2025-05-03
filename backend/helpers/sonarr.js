const axios = require('axios');
require('dotenv').config();

/**
 * Helper function to interact with Sonarr API
 * @param {string} endpoint - The API endpoint to call
 * @param {object} params - Optional query parameters
 * @returns {Promise<object>} - Transformed Sonarr data
 */

function normalizeTitle(title) {
  // Remove "the" from the beginning of titles and normalize
  return title.toLowerCase().replace(/^the\s+/, '').trim();
}

function calculateSimilarity(str1, str2) {
  // Simple Levenshtein distance-based similarity
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  // Calculate similarity percentage
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - (distance / maxLength);
}

async function getSonarrAvailableSeries(seriesName) {
    const endpoint = `${process.env.SONARR_URL}/api/v3/series`
    console.log('Calling Sonarr API:', endpoint);
    try {   
     const response = await axios.get(endpoint, {
       headers: {
         'X-Api-Key': process.env.SONARR_API_KEY
       }
     });
 
     // Transform the response to only include relevant data
     const data = response.data;
     const normalizedSearch = normalizeTitle(seriesName);
     
     // Filter and sort by similarity
     const filteredData = data
       .map(series => ({
         id: series.id || 0,
         title: series.title || '',
         alternateTitles: series.alternateTitles || [],
         //sortTitle: series.sortTitle || '',
         status: series.status || 'unknown',
         //ended: series.ended || false,
         //profileName: series.profileName || '',
         overview: series.overview || '',
         nextAiring: series.nextAiring || null,
         previousAiring: series.previousAiring || null,
         network: series.network || '',
         airTime: series.airTime || '',
         //images: series.images || [],
         OriginalLanguage: series.originalLanguage || { id: 0, name: '' },
         //remotePoster: series.remotePoster || '',
         seasons: series.seasons || [],
         year: series.year || 0,
         //path: series.path || '',
         //qualityProfileId: series.qualityProfileId || 0,
         //seasonFolder: series.seasonFolder || true,
         monitored: series.monitored || false,
         //monitorNewItems: series.monitorNewItems || 'all',
         //useSceneNumbering: series.useSceneNumbering || false,
         runtime: series.runtime || 0,
         //tvdbId: series.tvdbId || 0,
         //tvRageId: series.tvRageId || 0,
         //tvMazeId: series.tvMazeId || 0,
         tmdbId: series.tmdbId || 0,
         firstAired: series.firstAired || null,
         lastAired: series.lastAired || null,
         seriesType: series.seriesType || 'standard',
         cleanTitle: series.cleanTitle || '',
         imdbId: series.imdbId || '',
         //titleSlug: series.titleSlug || '',
         //rootFolderPath: series.rootFolderPath || '',
         //folder: series.folder || '',
         certification: series.certification || '',
         genres: series.genres || [],
         tags: series.tags || [],
         added: series.added || null,
         /*addOptions: series.addOptions || {
           ignoreEpisodesWithFiles: false,
           ignoreEpisodesWithoutFiles: false,
           monitor: 'unknown',
           searchForMissingEpisodes: false,
           searchForCutoffUnmetEpisodes: false
         },*/
         ratings: series.ratings || { votes: 0, value: 0 },
         statistics: series.statistics || {
           seasonCount: 0,
           episodeFileCount: 0,
           episodeCount: 0,
           totalEpisodeCount: 0,
           sizeOnDisk: 0,
           //releaseGroups: [],
           percentOfEpisodes: 0
         },
         episodesChanged: series.episodesChanged || false,
         similarity: calculateSimilarity(normalizeTitle(series.title || ''), normalizedSearch)
       }))
       .filter(series => series.similarity > 0.5) // Only include matches with >50% similarity
       .sort((a, b) => b.similarity - a.similarity); // Sort by similarity

     console.log('Filtered results:', filteredData);
     return filteredData;
   } catch (error) {
     console.error('Sonarr API Error:', error.message);
     throw new Error(`Failed to fetch data from Sonarr: ${error.message}`);
   }
 }

 async function getSonarrAvailableEpisodes(seriesId) {
    const endpoint = `${process.env.SONARR_URL}/api/v3/episode?seriesId=${seriesId}`
    console.log('Calling Sonarr API:', endpoint);
    try {   
     const response = await axios.get(endpoint, {
       headers: {
         'X-Api-Key': process.env.SONARR_API_KEY
       }
     });
 
     // Transform the response to match the Sonarr API specs
     const data = response.data;
     const transformedData = data.map(episode => ({
       // Basic episode info
       id: episode.id || 0,
       seriesId: episode.seriesId || 0,
       //tvdbId: episode.tvdbId || 0,
       //episodeFileId: episode.episodeFileId || 0,
       seasonNumber: episode.seasonNumber || 0,
       episodeNumber: episode.episodeNumber || 0,
       title: episode.title || '',
       airDate: episode.airDate || '',
       //airDateUtc: episode.airDateUtc || null,
       //lastSearchTime: episode.lastSearchTime || null,
       runtime: episode.runtime || 0,
       //finaleType: episode.finaleType || '',
       overview: (episode.overview || '').substring(0, 100),
       
       // Episode file info
       episodeFile: episode.episodeFile ? {
         id: episode.episodeFile.id || 0,
         seriesId: episode.episodeFile.seriesId || 0,
         seasonNumber: episode.episodeFile.seasonNumber || 0,
         //relativePath: episode.episodeFile.relativePath || '',
         //path: episode.episodeFile.path || '',
         size: episode.episodeFile.size || 0,
         dateAdded: episode.episodeFile.dateAdded || null,
         //sceneName: episode.episodeFile.sceneName || '',
         //releaseGroup: episode.episodeFile.releaseGroup || '',
         languages: episode.episodeFile.languages || [],
         quality: episode.episodeFile.quality ? {
           quality: {
             id: episode.episodeFile.quality.quality.id || 0,
             name: episode.episodeFile.quality.quality.name || '',
             source: episode.episodeFile.quality.quality.source || 'unknown',
             resolution: episode.episodeFile.quality.quality.resolution || 0
           }
           /*revision: {
             version: episode.episodeFile.quality.revision.version || 0,
             real: episode.episodeFile.quality.revision.real || 0,
             isRepack: episode.episodeFile.quality.revision.isRepack || false
           }*/
         } : {
           quality: { id: 0, name: '', source: 'unknown', resolution: 0 }
           /*revision: { version: 0, real: 0, isRepack: false }*/
         },
         //customFormats: episode.episodeFile.customFormats || [],
         customFormatScore: episode.episodeFile.customFormatScore || 0,
         indexerFlags: episode.episodeFile.indexerFlags || 0,
         //releaseType: episode.episodeFile.releaseType || 'unknown',
         mediaInfo: episode.episodeFile.mediaInfo ? {
           id: episode.episodeFile.mediaInfo.id || 0,
           audioBitrate: episode.episodeFile.mediaInfo.audioBitrate || 0,
           audioChannels: episode.episodeFile.mediaInfo.audioChannels || 0,
           audioCodec: episode.episodeFile.mediaInfo.audioCodec || '',
           audioLanguages: episode.episodeFile.mediaInfo.audioLanguages || '',
           audioStreamCount: episode.episodeFile.mediaInfo.audioStreamCount || 0,
           videoBitDepth: episode.episodeFile.mediaInfo.videoBitDepth || 0,
           videoBitrate: episode.episodeFile.mediaInfo.videoBitrate || 0,
           videoCodec: episode.episodeFile.mediaInfo.videoCodec || '',
           videoFps: episode.episodeFile.mediaInfo.videoFps || 0,
           videoDynamicRange: episode.episodeFile.mediaInfo.videoDynamicRange || '',
           videoDynamicRangeType: episode.episodeFile.mediaInfo.videoDynamicRangeType || '',
           resolution: episode.episodeFile.mediaInfo.resolution || '',
           runTime: episode.episodeFile.mediaInfo.runTime || '',
           scanType: episode.episodeFile.mediaInfo.scanType || '',
           subtitles: episode.episodeFile.mediaInfo.subtitles || ''
         } : {
           id: 0,
           audioBitrate: 0,
           audioChannels: 0,
           audioCodec: '',
           audioLanguages: '',
           audioStreamCount: 0,
           videoBitDepth: 0,
           videoBitrate: 0,
           videoCodec: '',
           videoFps: 0,
           videoDynamicRange: '',
           videoDynamicRangeType: '',
           resolution: '',
           runTime: '',
           scanType: '',
           subtitles: ''
         },
         qualityCutoffNotMet: episode.episodeFile.qualityCutoffNotMet || false
       } : null
       /*,
       // Episode status
       hasFile: episode.hasFile || false,
       monitored: episode.monitored || false,
       absoluteEpisodeNumber: episode.absoluteEpisodeNumber || 0,
       sceneAbsoluteEpisodeNumber: episode.sceneAbsoluteEpisodeNumber || 0,
       sceneEpisodeNumber: episode.sceneEpisodeNumber || 0,
       sceneSeasonNumber: episode.sceneSeasonNumber || 0,
       unverifiedSceneNumbering: episode.unverifiedSceneNumbering || false,
       endTime: episode.endTime || null,
       grabDate: episode.grabDate || null,
       
       // Series info
       series: episode.series ? {
         id: episode.series.id || 0,
         title: episode.series.title || '',
         alternateTitles: episode.series.alternateTitles || [],
         sortTitle: episode.series.sortTitle || '',
         status: episode.series.status || 'unknown',
         ended: episode.series.ended || false,
         profileName: episode.series.profileName || '',
         overview: episode.series.overview || '',
         nextAiring: episode.series.nextAiring || null,
         previousAiring: episode.series.previousAiring || null,
         network: episode.series.network || '',
         airTime: episode.series.airTime || '',
         images: episode.series.images || [],
         originalLanguage: episode.series.originalLanguage || { id: 0, name: '' },
         remotePoster: episode.series.remotePoster || '',
         seasons: episode.series.seasons || [],
         year: episode.series.year || 0,
         path: episode.series.path || '',
         qualityProfileId: episode.series.qualityProfileId || 0,
         seasonFolder: episode.series.seasonFolder || true,
         monitored: episode.series.monitored || false,
         monitorNewItems: episode.series.monitorNewItems || 'all',
         useSceneNumbering: episode.series.useSceneNumbering || false,
         runtime: episode.series.runtime || 0,
         tvdbId: episode.series.tvdbId || 0,
         tvRageId: episode.series.tvRageId || 0,
         tvMazeId: episode.series.tvMazeId || 0,
         tmdbId: episode.series.tmdbId || 0,
         firstAired: episode.series.firstAired || null,
         lastAired: episode.series.lastAired || null,
         seriesType: episode.series.seriesType || 'standard',
         cleanTitle: episode.series.cleanTitle || '',
         imdbId: episode.series.imdbId || '',
         titleSlug: episode.series.titleSlug || '',
         rootFolderPath: episode.series.rootFolderPath || '',
         folder: episode.series.folder || '',
         certification: episode.series.certification || '',
         genres: episode.series.genres || [],
         tags: episode.series.tags || [],
         added: episode.series.added || null,
         addOptions: episode.series.addOptions || {
           ignoreEpisodesWithFiles: false,
           ignoreEpisodesWithoutFiles: false,
           monitor: 'unknown',
           searchForMissingEpisodes: false,
           searchForCutoffUnmetEpisodes: false
         },
         ratings: episode.series.ratings || { votes: 0, value: 0 },
         statistics: episode.series.statistics || {
           seasonCount: 0,
           episodeFileCount: 0,
           episodeCount: 0,
           totalEpisodeCount: 0,
           sizeOnDisk: 0,
           releaseGroups: [],
           percentOfEpisodes: 0
         },
         episodesChanged: episode.series.episodesChanged || false
       } : null,
       
       // Images
       images: episode.images || []*/
     }));
 
     console.log('Transformed episodes:', transformedData);
     return transformedData;
   } catch (error) {
     console.error('Sonarr API Error:', error.message);
     throw new Error(`Failed to fetch data from Sonarr: ${error.message}`);
   }
 }


async function getSonarrData(endpoint) {
   console.log('Calling Sonarr API:', endpoint);
   try {   
    const response = await axios.get(`${process.env.SONARR_URL}/api/v3/${endpoint}`, {
      headers: {
        'X-Api-Key': process.env.SONARR_API_KEY
      }
    });

    // Transform the response to only include relevant data
    const data = response.data;
    const formattedData = data.map(series => ({
        id: series.id,
        title: series.title
      }));
    console.log(formattedData)
    return formattedData;
  } catch (error) {
    console.error('Sonarr API Error:', error.message);
    throw new Error(`Failed to fetch data from Sonarr: ${error.message}`);
  }
}

module.exports = {
  getSonarrData, getSonarrAvailableSeries, getSonarrAvailableEpisodes
}; 
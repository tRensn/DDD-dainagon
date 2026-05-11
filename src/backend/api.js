import { GAME_PARAMETERS } from '../constants.js';

const mockRanking = [];

export class BackendApi {
  saveScore(playerName, score) {
    console.log('[BackendApi mock] saveScore:', { playerName, score });

    mockRanking.push({ playerName, score });
    mockRanking.sort((a, b) => b.score - a.score);

    return Promise.resolve({
      success: true,
      playerName,
      score,
    });
  }

  getRanking() {
    console.log('[BackendApi mock] getRanking');

    return Promise.resolve(mockRanking.slice(0, 10));
  }

  updateFeverStatus(currentScore) {
    const isFever = currentScore >= GAME_PARAMETERS.FEVER_THRESHOLD;

    console.log('[BackendApi mock] updateFeverStatus:', {
      currentScore,
      feverThreshold: GAME_PARAMETERS.FEVER_THRESHOLD,
      isFever,
    });

    return Promise.resolve(isFever);
  }
}

export const backendApi = new BackendApi();

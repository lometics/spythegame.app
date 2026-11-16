import type { GameSettings } from './types'
import { defaultCategoryIds } from './pairs'

export const DEFAULT_SETTINGS: GameSettings = {
  timerSeconds: 0,
  pairSource: { selectedCategoryIds: defaultCategoryIds() },
  difficulty: 'close',
  spyCount: [1],
  spiesKnowEachOther: false,
  civiliansSeeHint: false,
  unawareSpy: false,
}

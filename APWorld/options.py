from dataclasses import dataclass

from Options import Choice, Toggle, PerGameCommonOptions, StartInventoryPool, DeathLink, OptionGroup, OptionSet, Range, DefaultOnToggle, TextChoice

class NNQ(DefaultOnToggle):
	"""Include Flare Nuinui Quest"""
	display_name = "Enabled"

class NNQGoal(Choice):
	"""The goal condition for this quest. All quests must be goaled for the slot to be considered goaled."""
	display_name = "Goal"
	option_bad = 0
	option_good = 1
	option_true = 2
	option_all_bosses = 3

	@classmethod
	def get_option_name(cls, id_):
		match id_:
			case 0: return 'First 5 Levels (Any Ending)'
			case 1: return 'First 5 Levels (Good Ending)'
			case 2: return 'All Levels'
			case 3: return 'All Bosses'

class NNQStartingCharacter(Choice):
	"""Which character you start as."""
	display_name = "Starting Character"
	default = 'random'
	option_flare = 0
	option_noel = 1

class NNQShuffleLevels(DefaultOnToggle):
	"""Randomise the unlock order of the levels."""
	display_name = "Randomise Level Order"

class NNQLevelItems(DefaultOnToggle):
	"""Make level access multiworld items."""
	display_name = "Randomise Level Access"

class NNQAllLevels(Toggle):
	"""Include all seven levels even if the goal only requires five."""
	display_name = "Always Include All Levels"

class NNQHiddenAreas(DefaultOnToggle):
	"""Add checks to the hidden achievement-granting areas in Casino, Harbor, and Yamato."""
	display_name = "Hidden Area Checks"

class NNQBossPlando(TextChoice):
	"""Shuffles bosses around to different locations. Supports plando placement."""
	display_name = "Boss Shuffle"
	option_none = 0
	option_no_duplicates = 1
	option_allow_duplicates = 2

class NNQCrossBoss(Toggle):
	"""If “Boss Shuffle” is enabled, can bosses from other quests be included in Nuinui Quest?"""
	display_name = "Cross-quest Boss Shuffling"

class NNQBossDrops(Toggle):
	"""Makes all bosses drop items, even if they don't normally."""
	display_name = "All Bosses Drop Items"

class NNQEnemySanity(Toggle):
	"""Makes killing each enemy a check. Enemies with an unclaimed item inside will emit Archipelago-coloured particles."""
	display_name = "Enemysanity"

class MMQ(Toggle):
	"""Include Marine Maiden Quest"""
	display_name = "Enabled"

class PRQ(Toggle):
	"""Include Pekora Random Quest"""
	display_name = "Enabled"

@dataclass
class FNNQOptions(PerGameCommonOptions):
	# General
	death_link: DeathLink

	# NNQ
	nnq: NNQ
	nnq_goal: NNQGoal
	nnq_all_levels: NNQAllLevels
	nnq_level_shuffle: NNQShuffleLevels
	nnq_level_items: NNQLevelItems
	nnq_starting_character: NNQStartingCharacter
	nnq_hidden_area_checks: NNQHiddenAreas
	nnq_boss_shuffle: NNQBossPlando
	nnq_boss_cross: NNQCrossBoss
	nnq_boss_all_drop: NNQBossDrops
	nnq_enemysanity: NNQEnemySanity

	# MMQ
	mmq: MMQ

	# PRQ
	prq: PRQ

	# c/i
	start_inventory_from_pool: StartInventoryPool

fnnq_option_groups = [
	OptionGroup("NUINUI QUEST", [
		NNQ,
		NNQGoal,
		NNQAllLevels,
		NNQShuffleLevels,
		NNQLevelItems,
		NNQStartingCharacter,
		NNQHiddenAreas,
		NNQBossPlando,
		NNQCrossBoss,
		NNQBossDrops,
		NNQEnemySanity,
	]),
	OptionGroup("MARINE MAIDEN QUEST", [
		MMQ
	]),
	OptionGroup("PEKORA RANDOM QUEST", [
		PRQ
	]),
]

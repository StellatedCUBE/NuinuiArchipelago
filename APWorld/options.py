from dataclasses import dataclass

from Options import Choice, Toggle, PerGameCommonOptions, StartInventoryPool, DeathLink, OptionGroup, OptionSet, Range, DefaultOnToggle, TextChoice

class CustomDeathLink(DeathLink):
	__doc__ = DeathLink.__doc__ + '\n\nThis can be changed during play using the /deathlink command in the in-game text console in the pause menu.'

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
	default = 2

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

class PRQ(Toggle):
	"""Include Pekora Random Quest"""
	display_name = "Enabled"

class PRQGoal(Choice):
	__doc__ = NNQGoal.__doc__
	display_name = "Goal"
	option_final_level = 0
	option_all_levels = 1

class PRQCasinoAccess(Toggle):
	"""Makes accessing the second part of Underworld Casino an item in the multiworld."""
	display_name = "Randomise Casino Access"

class PRQCasinoChecks(DefaultOnToggle):
	"""Adds checks for playing the crystal pachinko."""
	display_name = "Casino Game Checks"

class PRQBossPlando(NNQBossPlando):
	pass

class PRQCrossBoss(NNQCrossBoss):
	__doc__ = NNQCrossBoss.__doc__.replace('Nuinui', 'Random')

class PRQEnemySanity(NNQEnemySanity):
	pass

class PRQCrystalSanity(Toggle):
	"""Makes mining each crystal a check. Crystals with an unclaimed item inside will have an Archipelago-coloured sheen."""
	display_name = "Crystalsanity"

class PRQCrateSanity(Toggle):
	"""Makes breaking each crate a check. Crates with an unclaimed item inside will have the Archipelago logo stamped on them."""
	displayname = "Cratesanity"

class MMQ(Toggle):
	"""Include Marine Maiden Quest"""
	display_name = "Enabled"

@dataclass
class FNNQOptions(PerGameCommonOptions):
	# General
	death_link: CustomDeathLink

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

	# PRQ
	prq: PRQ
	prq_goal: PRQGoal
	prq_casino_access: PRQCasinoAccess
	prq_casino_checks: PRQCasinoChecks
	prq_boss_shuffle: PRQBossPlando
	prq_boss_cross: PRQCrossBoss
	prq_enemysanity: PRQEnemySanity
	prq_crystalsanity: PRQCrystalSanity
	prq_cratesanity: PRQCrateSanity

	# MMQ
	mmq: MMQ

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
	OptionGroup("PEKORA RANDOM QUEST", [
		PRQ,
		PRQGoal,
		PRQCasinoAccess,
		PRQCasinoChecks,
		PRQBossPlando,
		PRQCrossBoss,
		PRQEnemySanity,
		PRQCrystalSanity,
		PRQCrateSanity,
	]),
	OptionGroup("MARINE MAIDEN QUEST", [
		MMQ
	]),
]

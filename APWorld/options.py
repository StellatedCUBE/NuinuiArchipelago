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
			case 0: return 'First 5 Stages (Any Ending)'
			case 1: return 'First 5 Stages (Good Ending)'
			case 2: return 'All Stages'
			case 3: return 'All Bosses'

class NNQStartingCharacter(Choice):
	"""Which character you start as."""
	display_name = "Starting Character"
	option_flare = 0
	option_noel = 1

class NNQShuffleStages(DefaultOnToggle):
	"""Randomise the unlock order of the stages."""
	display_name = "Randomise Stage Order"

class NNQStageItems(DefaultOnToggle):
	"""Make stage access multiworld items."""
	display_name = "Randomise Stage Access"

class NNQAllStages(Toggle):
	"""Include all seven stages even if the goal only requires five."""
	display_name = "Always Include All Stages"

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
	option_final_stage = 0
	option_all_stages = 1

class PRQCasinoAccess(Toggle):
	"""Makes accessing the second part of Underworld Casino an item in the multiworld."""
	display_name = "Randomise Casino Access"

class PRQCasinoChecks(DefaultOnToggle):
	"""Adds checks for playing the crystal pachinko."""
	display_name = "Casino Game Checks"

class PRQBossPlando(NNQBossPlando):
	__doc__ = NNQBossPlando.__doc__

class PRQCrossBoss(NNQCrossBoss):
	__doc__ = NNQCrossBoss.__doc__.replace('Nuinui', 'Random')

class PRQBossDrops(Toggle):
	"""Makes midbosses drop checks upon defeat."""
	display_name = "Midboss Drops"

class PRQEnemySanity(NNQEnemySanity):
	__doc__ = NNQEnemySanity.__doc__

class PRQCrystalSanity(Toggle):
	"""Makes mining each crystal a check. Crystals with an unclaimed item inside will have an Archipelago-coloured sheen."""
	display_name = "Crystalsanity"

class PRQCrateSanity(Toggle):
	"""Makes breaking each crate a check. Crates with an unclaimed item inside will have the Archipelago logo stamped on them."""
	display_name = "Cratesanity"

class MMQ(Toggle):
	"""Include Marine Maiden Quest"""
	display_name = "Enabled"

class MMQGoal(Choice):
	__doc__ = NNQGoal.__doc__
	display_name = "Goal"
	option_final_stage = 0
	option_all_stages = 1
	option_all_coins = 2

class MMQCoinBehaviour(Choice):
	"""How checks are achieved. “Per Coin” means that each coin condition (goal, time, health) is its own check, while “By Coin Quantity” gives checks based on how many coins you get in a stage in a single run.
	This also affects the “All Coins” goal. Only pick “By Coin Quantity” if you are comfortable getting the “Sea of Gold” achievement."""
	display_name = "Checks Are"
	option_per_coin = 0
	option_by_coin_quantity = 1

class MMQShuffleStages(NNQShuffleStages):
	__doc__ = NNQShuffleStages.__doc__

class MMQStageItems(NNQStageItems):
	__doc__ = NNQStageItems.__doc__

class MMQBossPlando(NNQBossPlando):
	__doc__ = NNQBossPlando.__doc__

class MMQCrossBoss(NNQCrossBoss):
	__doc__ = NNQCrossBoss.__doc__.replace('Nuinui', 'Maiden')

@dataclass
class FNNQOptions(PerGameCommonOptions):
	# General
	death_link: CustomDeathLink

	# NNQ
	nnq: NNQ
	nnq_goal: NNQGoal
	nnq_all_stages: NNQAllStages
	nnq_stage_shuffle: NNQShuffleStages
	nnq_stage_items: NNQStageItems
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
	prq_boss_all_drop: PRQBossDrops
	prq_enemysanity: PRQEnemySanity
	prq_crystalsanity: PRQCrystalSanity
	prq_cratesanity: PRQCrateSanity

	# MMQ
	mmq: MMQ
	mmq_goal: MMQGoal
	mmq_coin_behaviour: MMQCoinBehaviour
	mmq_stage_shuffle: MMQShuffleStages
	mmq_stage_items: MMQStageItems
	prq_boss_shuffle: MMQBossPlando
	prq_boss_cross: MMQCrossBoss

	# c/i
	start_inventory_from_pool: StartInventoryPool

fnnq_option_groups = [
	OptionGroup("NUINUI QUEST", [
		NNQ,
		NNQGoal,
		NNQAllStages,
		NNQShuffleStages,
		NNQStageItems,
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
		PRQBossDrops,
		PRQEnemySanity,
		PRQCrystalSanity,
		PRQCrateSanity,
	]),
	OptionGroup("MARINE MAIDEN QUEST", [
		MMQ,
		MMQGoal,
		MMQCoinBehaviour,
		MMQShuffleStages,
		MMQStageItems,
		MMQBossPlando,
		MMQCrossBoss,
	]),
]

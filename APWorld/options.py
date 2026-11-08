from dataclasses import dataclass

from Options import Choice, Toggle, PerGameCommonOptions, StartInventoryPool, OptionGroup, OptionSet, Range, DefaultOnToggle, TextChoice

class DeathLink(TextChoice):
	"""When you die, everyone who enabled death link dies. Of course, the reverse is true too. If you enter a group name, you are only linked to the people in the same group.

	This can be adjusted later in the client using the /deathlink command in the in-game text console in the pause menu, unless race mode is enabled."""
	display_name = "Death Link"
	default = 0
	option_false = 0
	option_true = 1

	@classmethod
	def get_option_name(cls, value):
		return value if isinstance(value, str) else ('Yes' if value else 'No')

class DamageLink(DeathLink):
	"""When you take damage, everyone who enabled damage link also takes damage. Of course, the reverse is true too. If you enter a group name, you are only linked to the people in the same group.

	This can be adjusted later in the client using the /damagelink command in the in-game text console in the pause menu, unless race mode is enabled."""
	display_name = "Damage Link"

class KnockbackLink(DeathLink):
	"""When you are moved by something external, such as a fan or knockback from damage or, everyone who enabled knockback link is pushed in the same way. Of course, the reverse is true too. If you enter a group name, you are only linked to the people in the same group.

	This can be adjusted later in the client using the /knockbacklink command in the in-game text console in the pause menu, unless race mode is enabled."""
	display_name = "Knockback Link"

class TrapLink(DeathLink):
	"""When you receive a trap, people who enabled trap link may also receive an equivalent trap. Of course, the reverse is true too. If you enter a group name, you are only linked to the people in the same group.

	This can be adjusted later in the client using the /traplink command in the in-game text console in the pause menu, unless race mode is enabled."""
	display_name = "Trap Link"

class TagLink(DeathLink):
	"""When switch character in NUINUI QUEST, everyone who enabled tag link will also switch to that character if they have it, otherwise a random character. Of course, the reverse is true too. If you enter a group name, you are only linked to the people in the same group.

	This can be adjusted later in the client using the /taglink command in the in-game text console in the pause menu, unless race mode is enabled."""
	display_name = "Tag Link"

class MusicRando(Toggle):
	"""Shuffles all BGM in the game. Areas that normally have the same music will continue to do so (but it will be a different track.) Music from other mods and music packs is included in the pool."""
	display_name = "Randomise Music"

class BGRando(Choice):
	"""Randomises the backgrounds. “Shuffle” mode just swaps them around, while “Randomise” mixes and matches various layers and palettes to make new backgrounds."""
	display_name = "Randomise Backgrounds"
	option_no = 0
	option_shuffle = 1
	option_randomise = 2

class SFXRando(Toggle):
	"""Shuffles all sound effects in the game. Very much a gimmick option."""
	display_name = "Randomise SFX"

class EnemyTrapIntensity(Range):
	"""How frequent enemy-spawning traps should be"""
	display_name = "Enemy Trap Intensity"
	default = 0
	range_start = 0
	range_end = 10

class NNQ(Toggle):
	"""Include Flare Nuinui Quest"""
	display_name = "Enabled"

class NNQGoal(Choice):
	"""The goal condition for this quest. All quests must be goaled for the slot to be considered goaled."""
	display_name = "Goal"
	option_bad = 0
	option_good = 1
	option_true = 2
	option_all_bosses = 3
	option_holo_office = 4
	default = 2

	@classmethod
	def get_option_name(cls, id_):
		match id_:
			case 0: return 'First 5 Stages (Any Ending)'
			case 1: return 'First 5 Stages (Good Ending)'
			case 2: return 'All Stages'
			case 3: return 'All Bosses'
			case 4: return 'Holo Office'

class NNQStartingCharacter(Choice):
	"""Which character you start as."""
	display_name = "Starting Character"
	option_flare = 0
	option_noel = 1

class NNQOtherCharacter(DefaultOnToggle):
	"""Is the other character included in the item pool."""
	display_name = "Include Other Character"

class NNQStartingWeapon(Choice):
	"""If starting with Flare, which weapon you start with."""
	display_name = "Flare's Starting Weapon"
	default = 'random'
	option_dual_pistols = 0
	option_fire_shot = 1
	option_peko_rockets = 2
	option_sakura_shot = 3
	option_cutlass = 4
	option_dual_swords = 6

	@classmethod
	def get_option_name(cls, id_):
		return "Marine's Cutlass" if id_ == 4 else super(NNQStartingWeapon, cls).get_option_name(id_)


class NNQShuffleStages(DefaultOnToggle):
	"""Randomise the unlock order of the stages."""
	display_name = "Randomise Stage Order"

class NNQStageItems(DefaultOnToggle):
	"""Make stage access multiworld items."""
	display_name = "Randomise Stage Access"

class NNQAllStages(Toggle):
	"""Include all seven stages even if the goal only requires five."""
	display_name = "Always Include All Stages"

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

class NNQHeartChecks(Toggle):
	"""Makes hearts found on the ground items."""
	display_name = "Heart Checks"

class NNQAchievements(OptionSet):
	"""What achievement categories to make into locations. “Boss Fight Conditions” achievements are tied to the arena, not the boss, with the exception of “Introvert's Weakness” and “Frozen in Time”."""
	display_name = "Achievement Checks"
	rooms = 'Hidden Areas'
	quick = 'Quick Clears'
	boss = 'Boss Fight Conditions'
	hq = 'Only Flare / Only Noel!'
	misc = 'Miscellaneous'
	old = 'Old Version Exclusive'
	default = set()
	valid_keys = [
		rooms,
		quick,
		boss,
		hq,
		misc,
		old
	]

class NNQCheckpointSanity(Toggle):
	"""Makes reaching each checkpoint a location. Checkpoints with an unclaimed item inside will emit Archipelago-coloured particles."""
	display_name = "Checkpointsanity"

class NNQEnemySanity(Toggle):
	"""Makes killing each enemy a location. Enemies with an unclaimed item inside will emit Archipelago-coloured particles."""
	display_name = "Enemysanity"

class PRQ(Toggle):
	"""Include Pekora Random Quest"""
	display_name = "Enabled"

class PRQGoal(Choice):
	__doc__ = NNQGoal.__doc__
	display_name = "Goal"
	option_final_stage = 0
	option_all_stages = 1

class PRQCasinoAccess(DefaultOnToggle):
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
	"""Makes midbosses drop items upon defeat."""
	display_name = "Midboss Drops"

class PRQCheckpointSanity(NNQCheckpointSanity):
	__doc__ = NNQCheckpointSanity.__doc__

class PRQEnemySanity(NNQEnemySanity):
	__doc__ = NNQEnemySanity.__doc__

class PRQCrystalSanity(Toggle):
	"""Makes mining each crystal a location. Crystals with an unclaimed item inside will have an Archipelago-coloured sheen."""
	display_name = "Crystalsanity"

class PRQCrateSanity(Toggle):
	"""Makes breaking each crate a location. Crates with an unclaimed item inside will have the Archipelago logo stamped on them."""
	display_name = "Cratesanity"

class PRQOoB(DefaultOnToggle):
	"""Allow out-of-bounds skips to be performed."""
	display_name = "Allow OoB Skips"

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
	randomise_music: MusicRando
	randomise_backgrounds: BGRando
	randomise_sfx: SFXRando
	enemy_trap_intensity: EnemyTrapIntensity

	# Links
	death_link: DeathLink
	damage_link: DamageLink
	knockback_link: KnockbackLink
	trap_link: TrapLink
	tag_link: TagLink

	# NNQ
	nnq: NNQ
	nnq_goal: NNQGoal
	nnq_all_stages: NNQAllStages
	nnq_stage_shuffle: NNQShuffleStages
	nnq_stage_items: NNQStageItems
	nnq_starting_character: NNQStartingCharacter
	nnq_other_character: NNQOtherCharacter
	nnq_flare_starting_weapon: NNQStartingWeapon
	nnq_boss_shuffle: NNQBossPlando
	nnq_boss_cross: NNQCrossBoss
	nnq_boss_all_drop: NNQBossDrops
	nnq_heart_checks: NNQHeartChecks
	nnq_achievement_checks: NNQAchievements
	nnq_checkpointsanity: NNQCheckpointSanity
	nnq_enemysanity: NNQEnemySanity

	# PRQ
	prq: PRQ
	prq_goal: PRQGoal
	prq_casino_access: PRQCasinoAccess
	prq_casino_checks: PRQCasinoChecks
	prq_boss_shuffle: PRQBossPlando
	prq_boss_cross: PRQCrossBoss
	prq_boss_all_drop: PRQBossDrops
	prq_checkpointsanity: PRQCheckpointSanity
	prq_enemysanity: PRQEnemySanity
	prq_crystalsanity: PRQCrystalSanity
	prq_cratesanity: PRQCrateSanity
	prq_allow_oob: PRQOoB

	# MMQ
	mmq: MMQ
	mmq_goal: MMQGoal
	mmq_coin_behaviour: MMQCoinBehaviour
	mmq_stage_shuffle: MMQShuffleStages
	mmq_stage_items: MMQStageItems
	mmq_boss_shuffle: MMQBossPlando
	mmq_boss_cross: MMQCrossBoss

	# c/i
	start_inventory_from_pool: StartInventoryPool

fnnq_option_groups = [
	OptionGroup("Links", [
		DeathLink,
		DamageLink,
		KnockbackLink,
		TrapLink,
		TagLink,
	]),
	OptionGroup("NUINUI QUEST", [
		NNQ,
		NNQGoal,
		NNQAllStages,
		NNQShuffleStages,
		NNQStageItems,
		NNQStartingCharacter,
		NNQOtherCharacter,
		NNQStartingWeapon,
		NNQBossPlando,
		NNQCrossBoss,
		NNQBossDrops,
		NNQHeartChecks,
		NNQAchievements,
		NNQCheckpointSanity,
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
		PRQCheckpointSanity,
		PRQCrystalSanity,
		PRQCrateSanity,
		PRQOoB,
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

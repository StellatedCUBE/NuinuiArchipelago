from dataclasses import dataclass
from enum import Enum, IntFlag

from BaseClasses import ItemClassification, Location, LocationProgressType

from .data import *
from .boss import Drop
from . import nnq_levels
from .prq_enemy_data import prq_enemy_data
from .arenas import *
from .item import get_item, ItemCategory
from .nnq_levels.l2 import pre_marine_enemies
from .nnq_levels.l4 import pre_miko_enemies

class FNNQLocation(Location):
	game = GAME

class LocationCategory(Enum):
	MANUAL = 0
	LEVEL_CLEAR_NUINUI = 1
	LEVEL_CLEAR_RANDOM = 2
	LEVEL_CLEAR_NAMELESS = 3
	BOSS_DROP = 4
	HQ_LEVEL = 5
	NOUSAGI = 6
	SHOP = 7
	PACHINKO = 8
	COIN = 9
	ENEMYSANITY_NUINUI = 10
	ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE = 11
	ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE = 12
	SANITY_RANDOM = 13

class LocationFlags(IntFlag):
	NONE = 0
	CN_FLARE = 1
	CN_NOEL = 2
	CN_BOTH = 3
	NO_LOCAL_IMMEDIATE = 4
	NO_LOCAL_TRAP = 8
	NO_LOCAL_ONI = 16
	NO_LOCAL_KEY = 32
	SHOP = 64

@dataclass
class LocationType:
	type: LocationCategory
	sub_id: int
	name: str
	flags: LocationFlags = LocationFlags.NONE

	id: int = 0
	
	def __post_init__(self):
		self.id = (self.type.value << 16) | self.sub_id
	
	def build(self, world, region, rule=None, excluded=False):
		player = world.player
		built = FNNQLocation(player, self.name, self.id, region)
		if LocationFlags.NO_LOCAL_IMMEDIATE in self.flags:
			built.item_rule = lambda item: item.player != player or not get_item(item.code).immediate
		elif LocationFlags.NO_LOCAL_TRAP in self.flags:
			built.item_rule = lambda item: item.player != player or item.classification != ItemClassification.trap
		elif LocationFlags.NO_LOCAL_ONI in self.flags:
			built.item_rule = lambda item: item.player != player or item.name != 'Oni'
		elif LocationFlags.NO_LOCAL_KEY in self.flags:
			built.item_rule = lambda item: item.player != player or (item.name != 'Oni' and get_item(item.code).type != ItemCategory.KEY)
		elif LocationFlags.SHOP in self.flags:
			built.item_rule = lambda item: item.game != GAME or get_item(item.code).type not in (ItemCategory.HEART, ItemCategory.CRYSTALS, ItemCategory.NOUSAGI, ItemCategory.ALT_PALETTE, ItemCategory.ENEMY)
		region.locations.append(built)
		if rule is not None:
			world.set_rule(built, rule)
		if excluded:
			built.progress_type = LocationProgressType.EXCLUDED
		return built

	def __str__(self):
		return self.name

location_types = [
	LocationType(LocationCategory.MANUAL, 1, "Elfriends' gift (Underworld Casino)", LocationFlags.NO_LOCAL_TRAP),
	LocationType(LocationCategory.MANUAL, 2, "Elfriends' gift (Yamato)", LocationFlags.NO_LOCAL_TRAP),
	LocationType(LocationCategory.MANUAL, 3, 'Bad End', LocationFlags.CN_FLARE | LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 4, 'Good End', LocationFlags.CN_NOEL | LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 5, 'Defeat Aqua', LocationFlags.CN_FLARE | LocationFlags.NO_LOCAL_ONI),
	LocationType(LocationCategory.MANUAL, 6, 'Defeat Noel', LocationFlags.CN_FLARE | LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 7, 'Sky Palace midboss 1 drop', LocationFlags.NO_LOCAL_ONI),
	*(
		LocationType(LocationCategory.MANUAL, i, level + ' key', LocationFlags.NO_LOCAL_ONI)
		for i, level in enumerate(LEVELS[:5], start=10)
	),
	*(
		LocationType(LocationCategory.MANUAL, i, name + "'s challenge", characters, LocationFlags.NO_LOCAL_ONI)
		for i, (name, characters) in enumerate((('Koyori', LocationFlags.NONE), ('Chloe', LocationFlags.NONE), ('Lui', LocationFlags.CN_BOTH), ('Iroha', LocationFlags.CN_BOTH), ('La+', LocationFlags.CN_FLARE)), start=20)
	),
	LocationType(LocationCategory.MANUAL, 31, "Shion's dead end", LocationFlags.NO_LOCAL_ONI),
	LocationType(LocationCategory.MANUAL, 32, "Hidden treasure room", LocationFlags.NO_LOCAL_ONI),
	LocationType(LocationCategory.MANUAL, 33, "Poyoyo's room", LocationFlags.NO_LOCAL_ONI),
	LocationType(LocationCategory.MANUAL, 34, 'She Did Nothing Wrong', LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 35, 'Elite Win'),
	LocationType(LocationCategory.MANUAL, 36, 'Unfazed'),
	LocationType(LocationCategory.MANUAL, 37, 'No Scratches', LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 38, "Out of the Angel's Grasp"),
	LocationType(LocationCategory.MANUAL, 39, 'Water in the Fire Why', LocationFlags.CN_FLARE),
	LocationType(LocationCategory.MANUAL, 40, 'Only Flare!', LocationFlags.CN_FLARE | LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 41, 'Only Noel!', LocationFlags.CN_NOEL | LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 42, 'Perfect Debut'),
	LocationType(LocationCategory.MANUAL, 43, "Introvert's Weakness", LocationFlags.CN_FLARE),
	LocationType(LocationCategory.MANUAL, 44, 'Frozen in Time'),
	LocationType(LocationCategory.MANUAL, 45, 'Scythe No More', LocationFlags.NO_LOCAL_IMMEDIATE),
	LocationType(LocationCategory.MANUAL, 46, 'Uber Sheep'),
	*(
		LocationType(LocationCategory.MANUAL, i, level + ' quick clear', LocationFlags.NO_LOCAL_IMMEDIATE)
		for i, level in enumerate(LEVELS[:5], start=50)
	),
	*(
		LocationType(category, i, prefix + 'Clear ' + level, LocationFlags.NO_LOCAL_IMMEDIATE)
		for i, level in enumerate(LEVELS)
		for category, prefix in ((LocationCategory.LEVEL_CLEAR_NUINUI, '(Nuinui Quest) '), (LocationCategory.LEVEL_CLEAR_RANDOM, '(Random Quest) '), (LocationCategory.LEVEL_CLEAR_NAMELESS, ''))
		if (i != 4 or category != LocationCategory.LEVEL_CLEAR_NUINUI) and (i != 6 or category != LocationCategory.LEVEL_CLEAR_RANDOM)
	),
	*(
		LocationType(LocationCategory.BOSS_DROP, i, arena.fqname + ' drop' if 'boss' in arena.name else arena.fqname + ' boss drop', {
			'Demon Lord Castle lift': LocationFlags.CN_NOEL,
			'Demon Lord Castle turret': LocationFlags.CN_NOEL,
			'Sky Palace secret boss': LocationFlags.CN_FLARE
		}.get(arena.fqname, LocationFlags.NONE) | LocationFlags.NO_LOCAL_ONI)
		for i, arena in enumerate(nnq_arenas() + prq_arenas())
		if arena.drop != Drop.NEVER
	),
	*(
		LocationType(LocationCategory.HQ_LEVEL, i, f'Holo Office floor {i} clear', LocationFlags.NO_LOCAL_KEY)
		for i in range(1, 6)
	),
	*(
		LocationType(LocationCategory.NOUSAGI, i * 4 + j, f'{level} Nousagi {j}', LocationFlags.NO_LOCAL_TRAP)
		for i, level in enumerate(LEVELS[:5])
		for j in range(1, 4)
	),
	*(
		LocationType(LocationCategory.SHOP, i, f'Pekoshop item {i + 1}', LocationFlags.SHOP)
		for i in range(3)
	),
	LocationType(LocationCategory.PACHINKO, 0, 'Pachinko moving target'),
	LocationType(LocationCategory.PACHINKO, 1, 'Pachinko leftmost target'),
	LocationType(LocationCategory.PACHINKO, 2, 'Pachinko rightmost target'),
	LocationType(LocationCategory.PACHINKO, 3, 'Pachinko second-from-left target'),
	LocationType(LocationCategory.PACHINKO, 4, 'Pachinko second-from-right target'),
	LocationType(LocationCategory.PACHINKO, 5, 'Pachinko skull block'),
	*(
		LocationType(LocationCategory.COIN, level * 8 + i, f'Maiden Quest stage {level:0>2} {challenge}', LocationFlags.NO_LOCAL_IMMEDIATE)
		for level in range(1, 29)
		for i, challenge in enumerate(('clear', 'time coin', 'health coin', '2 coins', '3 coins'))
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI, i, f'{name} in Nuinui Quest {level} at x: {x}, y: {y}',
			(LocationFlags.CN_FLARE if name == 'Ghost' or i in (126,638,1150) else (LocationFlags.CN_NOEL if i == 132 else LocationFlags.NONE)) | (LocationFlags.NO_LOCAL_ONI if name == 'Heart' else LocationFlags.NONE)
		)
		for level, mod in zip(LEVELS, nnq_levels.level_modules)
		for i, name, x, y in mod.enemies
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE, i, ('Right', 'Left')[j] + ' cannon of Nuinui Quest Pirate Harbor boat' if name == 'Cannon' else f'{name} {j} of Nuinui Quest Pirate Harbor pre-final-boss enemies')
		for i, (name, j) in enumerate(pre_marine_enemies)
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE, i, f'{name} {j} of enemy wave {wave} on Nuinui Quest Demon Lord Castle final bridge' if j else f'{name} of enemy wave {wave} on Nuinui Quest Demon Lord Castle final bridge')
		for i, (name, wave, j) in enumerate(pre_miko_enemies)
	),
	*(
		LocationType(LocationCategory.SANITY_RANDOM, i, f'{name} in Random Quest {level} at x: {x}, y: {y}')
		for level, objects in zip(LEVELS, prq_enemy_data)
		for i, name, x, y in objects
	)
]

def get_location(x, require_valid=True):
	if isinstance(x, tuple):
		x = (x[0].value << 16) | x[1]
	try:
		if isinstance(x, int):
			return next(i for i in location_types if i.id == x)
		x = str(x)
		return next(i for i in location_types if i.name == x)
	except StopIteration:
		if require_valid:
			raise ValueError('%r is not a valid location' % x)
		return None

location_name_to_id = {
	l.name: l.id
	for l in location_types
}

#print({l: [v for k,v in location_name_to_id.items() if 'Heart' in k and l in k]for l in LEVELS})

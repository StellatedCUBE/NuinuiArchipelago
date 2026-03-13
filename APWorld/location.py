from dataclasses import dataclass
from enum import Enum

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

	ENEMYSANITY_NUINUI = 10
	ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE = 11
	ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE = 12
	SANITY_RANDOM = 13

@dataclass
class LocationType:
	type: LocationCategory
	sub_id: int
	name: str

	id: int = 0
	
	def __post_init__(self):
		self.id = (self.type.value << 16) | self.sub_id
	
	def build(self, player, region, rule=None):
		built = FNNQLocation(player, self.name, self.id, region)
		if rule:
			built.access_rule = rule
		match self.type:
			case LocationCategory.HQ_LEVEL: built.item_rule = lambda item: item.player != player or 'key' not in item.name
			case LocationCategory.SHOP: built.item_rule = lambda item: ItemClassification.trap not in item.classification and (item.game != GAME or get_item(item.name).type not in (ItemCategory.CRYSTALS, ItemCategory.HEART, ItemCategory.NOUSAGI))
			case LocationCategory.PACHINKO if self.sub_id == 5: built.progress_type = LocationProgressType.EXCLUDED
		region.locations.append(built)
		return built

	def __str__(self):
		return self.name

location_types = [
	LocationType(LocationCategory.MANUAL, 1, "Elfriends' gift (Underworld Casino)"),
	LocationType(LocationCategory.MANUAL, 2, "Elfriends' gift (Yamato)"),
	LocationType(LocationCategory.MANUAL, 3, 'Bad end'),
	LocationType(LocationCategory.MANUAL, 4, 'Good end'),
	LocationType(LocationCategory.MANUAL, 5, 'Defeat Aqua'),
	LocationType(LocationCategory.MANUAL, 6, 'Defeat Noel'),
	LocationType(LocationCategory.MANUAL, 7, 'Sky Palace midboss 1 drop'),
	*(
		LocationType(LocationCategory.MANUAL, i, level + ' key')
		for i, level in enumerate(LEVELS[:5], start=10)
	),
	*(
		LocationType(LocationCategory.MANUAL, i, name + "'s badge")
		for i, name in enumerate(('Koyori', 'Chloe', 'Lui', 'Iroha', 'La+'), start=20)
	),
	LocationType(LocationCategory.MANUAL, 31, "Shion's dead end"),
	LocationType(LocationCategory.MANUAL, 32, "Hidden treasure room"),
	LocationType(LocationCategory.MANUAL, 33, "Poyoyo's room"),
	*(
		LocationType(category, i, prefix + 'Clear ' + level)
		for i, level in enumerate(LEVELS)
		for category, prefix in ((LocationCategory.LEVEL_CLEAR_NUINUI, '(Nuinui Quest) '), (LocationCategory.LEVEL_CLEAR_RANDOM, '(Random Quest) '), (LocationCategory.LEVEL_CLEAR_NAMELESS, ''))
		if (i != 4 or category != LocationCategory.LEVEL_CLEAR_NUINUI) and (i != 6 or category != LocationCategory.LEVEL_CLEAR_RANDOM)
	),
	*(
		LocationType(LocationCategory.BOSS_DROP, i, arena.name + ' drop' if 'boss' in arena.name else arena.name + ' boss drop')
		for i, arena in enumerate(nnq_arenas())
		if arena.drop != Drop.NEVER
	),
	LocationType(LocationCategory.BOSS_DROP, 23, 'Random Quest Underworld Casino game room boss drop'),
	*(
		LocationType(LocationCategory.HQ_LEVEL, i, f'Holo Office floor {i} clear')
		for i in range(1, 6)
	),
	*(
		LocationType(LocationCategory.NOUSAGI, i * 4 + j, f'{level} Nousagi {j}')
		for i, level in enumerate(LEVELS[:5])
		for j in range(1, 4)
	),
	*(
		LocationType(LocationCategory.SHOP, i, f'Pekoshop item {i + 1}')
		for i in range(3)
	),
	LocationType(LocationCategory.PACHINKO, 0, 'Pachinko moving target'),
	LocationType(LocationCategory.PACHINKO, 1, 'Pachinko leftmost target'),
	LocationType(LocationCategory.PACHINKO, 2, 'Pachinko rightmost target'),
	LocationType(LocationCategory.PACHINKO, 3, 'Pachinko second-from-left target'),
	LocationType(LocationCategory.PACHINKO, 4, 'Pachinko second-from-right target'),
	LocationType(LocationCategory.PACHINKO, 5, 'Pachinko skull block'),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI, i, f'{name} in Nuinui Quest {level} at x: {x}, y: {y}')
		for level, mod in zip(LEVELS, nnq_levels.level_modules)
		for i, name, x, y in mod.enemies
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE, i, ('Right', 'Left')[j] + ' cannon of Pirate Harbor boat' if name == 'Cannon' else f'{name} {j} of Pirate Harbor pre-final-boss enemies')
		for i, (name, j) in enumerate(pre_marine_enemies)
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE, i, f'{name} {j} of enemy wave {wave} at Demon Lord Castle final bridge' if j else f'{name} of enemy wave {wave} at Demon Lord Castle final bridge')
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

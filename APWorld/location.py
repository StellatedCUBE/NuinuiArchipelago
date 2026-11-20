from dataclasses import dataclass
from enum import Enum, IntFlag

from BaseClasses import ItemClassification, Location, LocationProgressType

from .data import *
from .boss import Drop, NQ
from .nnq_levels import level_modules
from .prq_enemy_data import prq_enemy_data, prq_regions
from .arenas import *
from .item import get_item, ItemCategory
from .nnq_levels.l2 import pre_marine_enemies
from .nnq_levels.l4 import pre_miko_enemies
from .options import NNQAchievements

class FNNQLocation(Location):
	game = GAME

class LocationCategory(Enum):
	MANUAL = 0
	LEVEL_CLEAR_NUINUI = 1
	LEVEL_CLEAR_RANDOM = 2
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
	NO_TRAP = 128

@dataclass
class LocationType:
	type: LocationCategory
	sub_id: int
	name: str
	flags: LocationFlags = LocationFlags.NONE

	id: int = 0
	
	def __post_init__(self):
		self.id = (self.type.value << 16) | self.sub_id
	
	def build(self, world, is_empty_event, region, rule=None, excluded=False):
		player = world.player
		built = FNNQLocation(player, self.name, None if is_empty_event else self.id, region)
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
		elif LocationFlags.NO_TRAP in self.flags:
			built.item_rule = lambda item: item.classification != ItemClassification.trap
		region.locations.append(built)
		if rule is not None:
			world.set_rule(built, rule)
		if is_empty_event:
			built.place_locked_item(world.create_item(None))
			built.show_in_spoiler = False
		elif excluded:
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
	LocationType(LocationCategory.MANUAL, 7, NQ + 'Sky Palace midboss 1 drop', LocationFlags.NO_LOCAL_ONI),
	LocationType(LocationCategory.MANUAL, 8, 'Win 3 times at Tsunomaki Janken'),
	LocationType(LocationCategory.MANUAL, 9, 'Survive 1 minute in the Noel fight'),
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
	LocationType(LocationCategory.MANUAL, 47, 'Bounce on Watamelons twice without landing'),
	*(
		LocationType(LocationCategory.MANUAL, i, level + ' quick clear', LocationFlags.NO_LOCAL_IMMEDIATE)
		for i, level in enumerate(LEVELS[:5], start=50)
	),
	*(
		LocationType(LocationCategory.LEVEL_CLEAR_NUINUI, i, '(Nuinui Quest) Clear ' + level, LocationFlags.NO_LOCAL_IMMEDIATE)
		for i, level in enumerate(LEVELS)
		if i != 4
	),
	*(
		LocationType(LocationCategory.LEVEL_CLEAR_RANDOM, i, '(Random Quest) Clear ' + level, LocationFlags.NO_LOCAL_IMMEDIATE)
		for i, level in enumerate(LEVELS[:-1])
	),
	*(
		LocationType(LocationCategory.BOSS_DROP, i, arena.fqname + ' drop' if 'boss' in arena.name else arena.fqname + ' boss drop', {
			'Demon Lord Castle lift': LocationFlags.CN_NOEL,
			'Demon Lord Castle turret': LocationFlags.CN_NOEL,
			'Sky Palace secret boss': LocationFlags.CN_FLARE
		}.get(arena.name, LocationFlags.NONE) | LocationFlags.NO_LOCAL_ONI)
		for i, arena in enumerate(nnq_arenas() + prq_arenas())
		if arena.drop != Drop.NEVER
	),
	*(
		LocationType(LocationCategory.HQ_LEVEL, i, f'(Nuinui Quest) Holo Office floor {i} clear', LocationFlags.NO_LOCAL_KEY)
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
	LocationType(LocationCategory.PACHINKO, 0, 'Pachinko moving target', LocationFlags.NO_TRAP),
	LocationType(LocationCategory.PACHINKO, 1, 'Pachinko leftmost target', LocationFlags.NO_TRAP),
	LocationType(LocationCategory.PACHINKO, 2, 'Pachinko rightmost target', LocationFlags.NO_TRAP),
	LocationType(LocationCategory.PACHINKO, 3, 'Pachinko second-from-left target', LocationFlags.NO_TRAP),
	LocationType(LocationCategory.PACHINKO, 4, 'Pachinko second-from-right target', LocationFlags.NO_TRAP),
	LocationType(LocationCategory.PACHINKO, 5, 'Pachinko skull block'),
	*(
		LocationType(LocationCategory.COIN, level * 8 + i, f'(Maiden Quest) Stage {level:0>2} {challenge}', LocationFlags.NO_LOCAL_IMMEDIATE)
		for level in range(1, 29)
		for i, challenge in enumerate(('clear', 'time coin', 'health coin', '2 coins', '3 coins'))
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI, i, #f'(Nuinui Quest) {name} in {level} at x: {x}, y: {y}',
			(
				(
					(
						f'(Nuinui Quest) {level} checkpoint before {mod.regions[region]}'
						if any(name == n and region == r and i < j for j, n, r in mod.enemies) else
						f'(Nuinui Quest) {level} checkpoint after {mod.regions[region]}'
					) if name == 'checkpoint' else
					f'(Nuinui Quest) {level} {mod.regions[region]} {name} {sum(name == n and region == r and i >= j for j, n, r in mod.enemies)}'
				) if any(name == n and region == r and i != j for j, n, r in mod.enemies) else
				f'(Nuinui Quest) {level} {mod.regions[region]} {name}'
			),
			(LocationFlags.CN_FLARE if name == 'ghost' or i in (126,638,1150) else (LocationFlags.CN_NOEL if i == 132 else LocationFlags.NONE)) | (LocationFlags.NO_LOCAL_ONI if name == 'heart' else LocationFlags.NONE)
		)
		for level, mod in zip(LEVELS, level_modules)
		for i, name, region in mod.enemies
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE, i, '(Nuinui Quest) ' + LEVELS[2] + ' boat ' + ('right', 'left')[j] + ' cannon' if name == 'cannon' else f'(Nuinui Quest) {LEVELS[2]} pre-final-boss {name} {j}')
		for i, (name, j) in enumerate(pre_marine_enemies)
	),
	*(
		LocationType(LocationCategory.ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE, i, f'(Nuinui Quest) {LEVELS[4]} final bridge wave {wave} {name} {j}' if j else f'(Nuinui Quest) {LEVELS[4]} final bridge wave {wave} {name}')
		for i, (name, wave, j) in enumerate(pre_miko_enemies)
	),
	*(
		LocationType(LocationCategory.SANITY_RANDOM, i, (
			f'(Random Quest) {level} {prq_regions[region]} {name} {sum(name == n and region == r and i >= j for j, n, r, _ in objects)}'
			if any(name == n and region == r and i != j for j, n, r, _ in objects) else
			f'(Random Quest) {level} {prq_regions[region]} {name}'
		))
		for level, objects in zip(LEVELS, prq_enemy_data)
		for i, name, region, y in objects
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

location_name_groups = {}

def add_location_to_group(location, group_name):
	group = location_name_groups.get(group_name)
	if group is None: group = location_name_groups[group_name] = set()
	group.add(str(location))

for loc in location_types:
	match loc.type:
		case LocationCategory.MANUAL:
			add_location_to_group(loc, 'Nuinui Quest')
			if 2 < loc.id < 5:
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[4])
				add_location_to_group(loc, '(Nuinui Quest) Clear ' + LEVELS[4])
				add_location_to_group(loc, '(Nuinui Quest) Clear stage')
			if 5 < loc.id < 8:
				add_location_to_group(loc, '(Nuinui Quest) Boss drop')
			if 7 < loc.id < 10 or loc.id == 47:
				add_location_to_group(loc, 'Achievement')
				add_location_to_group(loc, NNQAchievements.old + ' Achievement')
			if 9 < loc.id < 20:
				add_location_to_group(loc, 'Key')
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[loc.id % 10])
			if 19 < loc.id < 30:
				add_location_to_group(loc, 'HoloX challenge')
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[loc.id % 10])
			if 29 < loc.id < 34:
				add_location_to_group(loc, 'Hidden Area')
				add_location_to_group(loc, 'Achievement')
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[loc.id % 10])
			if loc.id in (34, 39, 45):
				add_location_to_group(loc, 'Achievement')
				add_location_to_group(loc, NNQAchievements.misc + ' Achievement')
			if 34 < loc.id < 39 or 42 < loc.id < 45 or loc.id == 46:
				add_location_to_group(loc, 'Boss Fight Condition')
				add_location_to_group(loc, 'Achievement')
			if 39 < loc.id < 42:
				add_location_to_group(loc, 'Only <Character>!')
				add_location_to_group(loc, 'Achievement')
			if 49 < loc.id < 60:
				add_location_to_group(loc, 'Quick clear')
				add_location_to_group(loc, 'Achievement')
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[loc.id % 10])
			if loc.id in (8, 34, 36, 42):
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[0])
			if loc.id in (1, 45):
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[1])
			if loc.id in (5, 37):
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[2])
			if loc.id in (2, 6, 9):
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[3])
			if 38 < loc.id < 42:
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[5])
			if loc.id in (7, 38, 46, 47):
				add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[6])
		case LocationCategory.LEVEL_CLEAR_NUINUI:
			add_location_to_group(loc, '(Nuinui Quest) Clear stage')
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[loc.sub_id])
		case LocationCategory.LEVEL_CLEAR_RANDOM:
			add_location_to_group(loc, '(Random Quest) Clear stage')
			add_location_to_group(loc, '(Random Quest) ' + LEVELS[loc.sub_id])
		case LocationCategory.BOSS_DROP:
			add_location_to_group(loc, loc.name.split(')')[0] + ') Boss drop')
		case LocationCategory.HQ_LEVEL:
			add_location_to_group(loc, '(Nuinui Quest) Boss drop')
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[5])
			add_location_to_group(loc, LEVELS[5] + ' floor clear')
		case LocationCategory.NOUSAGI:
			add_location_to_group(loc, 'Nousagi')
			add_location_to_group(loc, '(Random Quest) ' + LEVELS[loc.sub_id >> 2])
			add_location_to_group(loc, LEVELS[loc.sub_id >> 2] + ' Nousagi')
		case LocationCategory.SHOP:
			add_location_to_group(loc, 'Random Quest')
			add_location_to_group(loc, 'Pekoshop')
		case LocationCategory.PACHINKO:
			add_location_to_group(loc, '(Random Quest) ' + LEVELS[1])
			add_location_to_group(loc, 'Pachinko')
		case LocationCategory.COIN:
			add_location_to_group(loc, 'Coin')
			add_location_to_group(loc, f'(Maiden Quest) Stage {loc.sub_id >> 3:0>2}')
			match loc.sub_id & 7:
				case 0: add_location_to_group(loc, '(Maiden Quest) Clear stage')
				case 1: add_location_to_group(loc, 'Time coin')
				case 2: add_location_to_group(loc, 'Health coin')
				case 3: add_location_to_group(loc, 'Coin 2')
				case 4: add_location_to_group(loc, 'Coin 3')
			level = loc.sub_id >> 3
			if level < 4: add_location_to_group(loc, '(Maiden Quest) Ghost Ship')
			elif level < 8: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[2])
			elif level < 12: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[3])
			elif level < 16: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[1])
			elif level < 20: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[4])
			elif level < 24: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[0])
			elif level < 28: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[6])
			else: add_location_to_group(loc, '(Maiden Quest) ' + LEVELS[5])
		case LocationCategory.ENEMYSANITY_NUINUI:
			level = loc.sub_id & 7
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[level])
			for i, name, _ in level_modules[level].enemies:
				if i == loc.sub_id:
					if name == 'heart':
						add_location_to_group(loc, 'Heart')
						if level: add_location_to_group(loc, LEVELS[level] + ' heart')
					elif name == 'checkpoint':
						add_location_to_group(loc, '(Nuinui Quest) Checkpointsanity')
						add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[level] + ' checkpointsanity')
					else:
						add_location_to_group(loc, '(Nuinui Quest) Enemysanity')
						add_location_to_group(loc, '(Nuinui Quest) Enemysanity ' + name.replace('axe ', 'sword '))
						add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[level] + ' enemysanity')
					break
		case LocationCategory.ENEMYSANITY_NUINUI_PORT_BOSS_PRELUDE:
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[2])
			add_location_to_group(loc, '(Nuinui Quest) Enemysanity')
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[2] + ' enemysanity')
			add_location_to_group(loc, '(Nuinui Quest) Enemysanity ' + pre_marine_enemies[loc.sub_id][0])
		case LocationCategory.ENEMYSANITY_NUINUI_CASTLE_BOSS_PRELUDE:
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[4])
			add_location_to_group(loc, '(Nuinui Quest) Enemysanity')
			add_location_to_group(loc, '(Nuinui Quest) ' + LEVELS[4] + ' enemysanity')
			add_location_to_group(loc, '(Nuinui Quest) Enemysanity ' + pre_miko_enemies[loc.sub_id][0].replace('axe ', 'sword '))
		case LocationCategory.SANITY_RANDOM:
			level = loc.sub_id & 7
			add_location_to_group(loc, '(Random Quest) ' + LEVELS[level])
			for i, name, x, y in prq_enemy_data[level]:
				if i == loc.sub_id:
					if name == 'checkpoint':
						add_location_to_group(loc, '(Random Quest) Checkpointsanity')
						add_location_to_group(loc, '(Random Quest) ' + LEVELS[level] + ' checkpointsanity')
					elif name == 'crate':
						add_location_to_group(loc, 'Cratesanity')
						add_location_to_group(loc, LEVELS[level] + ' cratesanity')
					elif name == 'crystal':
						add_location_to_group(loc, 'Crystalsanity')
						add_location_to_group(loc, LEVELS[level] + ' crystalsanity')
					else:
						add_location_to_group(loc, '(Random Quest) Enemysanity')
						add_location_to_group(loc, '(Random Quest) Enemysanity ' + name.replace('axe ', 'sword '))
						add_location_to_group(loc, '(Random Quest) ' + LEVELS[level] + ' enemysanity')
					break

for name, group in [*location_name_groups.items(), *((n, {n}) for n, i in location_name_to_id.items() if i < 9 << 16)]:
	if 'Quest) ' in name:
		quest = name.split(')')[0][1:]
		sub = name.split('Quest) ')[1]
		for loc in group:
			add_location_to_group(loc, quest)
			add_location_to_group(loc, sub)

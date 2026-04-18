from dataclasses import dataclass
from enum import Enum

from Options import OptionError

from .data import SHOTS

A_PRQ = {
	'Random Quest Crystal Falls modboss',
	'Random Quest Crystal Falls final boss',
	'Random Quest Underworld Casino game room',
	'Random Quest Underworld Casino final boss',
	'Random Quest Pirate Harbor midboss',
	'Random Quest Pirate Harbor final boss',
	'Random Quest Yamato midboss',
	'Random Quest Yamato final boss',
	'Random Quest Demon Lord Castle midboss',
	'Random Quest Demon Lord Castle final boss',
	'Random Quest Holo Office',
}

A_BRIDGE = {
	"Ina's office",

	'Stage 07',
}

A_FLOORED = {
	*A_BRIDGE,
	'Crystal Falls midboss',
	'Crystal Falls final boss',
	'Underworld Casino midboss',
	'Underworld Casino final boss',
	'Yamato midboss 1',
	'Yamato midboss 2',
	'Yamato midboss 3',
	'Demon Lord Castle midboss 1',
	'Demon Lord Castle midboss 2',
	'Demon Lord Castle throne room',
	'Demon Lord Castle lift',
	'Demon Lord Castle turret',
	"Kiara's office",
	"Mori's office",
	"Gura's office",
	"Ame's office",
	'Sky Palace secret boss',
	'Sky Palace final boss',

	'Random Quest Crystal Falls final boss',
	'Random Quest Underworld Casino final boss',
	'Random Quest Pirate Harbor midboss',
	'Random Quest Pirate Harbor final boss',
	'Random Quest Yamato midboss',
	'Random Quest Yamato final boss',
	'Random Quest Demon Lord Castle midboss',
	'Random Quest Demon Lord Castle final boss',
	'Random Quest Holo Office',

	'Stage 03',
	'Stage 05',
	'Stage 09',
	'Stage 11',
	'Stage 15',
	'Stage 17',
	'Stage 19',
	'Stage 21',
	'Stage 23',
	'Stage 27',
	'Stage 28',
}

A_ROUGH_FLOORED = {
	*A_FLOORED,
	'Random Quest Crystal Falls midboss',
	'Random Quest Underworld Casino game room',

	'Stage 13',
}

A_VISIBLY_WALLED = {
	'Crystal Falls midboss',
	'Crystal Falls final boss',
	'Underworld Casino midboss',
	'Yamato midboss 1',
	'Yamato midboss 2',
	'Demon Lord Castle midboss 1',
	'Demon Lord Castle midboss 2',
	'Demon Lord Castle throne room',
	'Demon Lord Castle lift',
	"Kiara's office",
	"Ame's office",
	'Sky Palace secret boss',

	'Random Quest Crystal Falls midboss',
	'Random Quest Underworld Casino game room',
	'Random Quest Yamato midboss',
	'Random Quest Demon Lord Castle midboss',

	'Stage 03',
	'Stage 09',
	'Stage 11',
	'Stage 13',
	'Stage 17',
	'Stage 23',
}

A_WALLED = {
	*A_VISIBLY_WALLED,
	*A_BRIDGE,
	'Underworld Casino final boss',
	'Pirate Harbor boss',
	'Yamato midboss 3',
	"Mori's office",
	'Sky Palace final boss',

	'Random Quest Crystal Falls final boss',
	'Random Quest Underworld Casino final boss',
	'Random Quest Pirate Harbor midboss',
	'Random Quest Pirate Harbor final boss',

	'Stage 05',
	'Stage 15',
	'Stage 21',
	'Stage 25',
	'Stage 27',
}

A_ROOFED = {
	'Crystal Falls final boss',
	'Yamato midboss 2',
	'Demon Lord Castle midboss 2',
	"Ame's office",
	'Sky Palace final boss',

	'Random Quest Crystal Falls midboss',
	'Random Quest Underworld Casino game room',
	'Random Quest Pirate Harbor midboss',
	'Random Quest Yamato midboss',

	'Stage 03',
	'Stage 09',
	'Stage 11',
	'Stage 17',
	'Stage 23',
	'Stage 27',
}

A_CAN_BE_ROOFED = {
	*A_ROOFED,
	'Underworld Casino midboss',
	'Demon Lord Castle throne room',
	"Kiara's office",
	'Sky Palace secret boss',

	'Stage 13',
}

A_ANY_ROOFED = {
	*A_ROOFED,
	'Yamato midboss 1',
	'Demon Lord Castle midboss 1',

	'Stage 05',
}

A_SINGLE_SCREEN = {
	*A_BRIDGE,
	'Crystal Falls midboss',
	'Crystal Falls final boss',
	'Underworld Casino final boss',
	'Pirate Harbor boss',
	'Yamato midboss 3',
	'Demon Lord Castle midboss 1',
	'Demon Lord Castle midboss 2',
	'Demon Lord Castle lift',
	'Demon Lord Castle turret',
	"Kiara's office",
	"Mori's office",
	"Gura's office",
	"Ame's office",
	'Sky Palace midboss 2',
	'Sky Palace secret boss',
	'Sky Palace final boss',

	'Random Quest Crystal Falls midboss',
	'Random Quest Crystal Falls final boss',
	'Random Quest Underworld Casino game room',
	'Random Quest Underworld Casino final boss',
	'Random Quest Pirate Harbor midboss',
	'Random Quest Pirate Harbor final boss',
	'Random Quest Yamato final boss',
	'Random Quest Demon Lord Castle midboss',
	'Random Quest Demon Lord Castle final boss',
	'Random Quest Holo Office',

	'Stage 03',
	'Stage 05',
	'Stage 13',
	'Stage 15',
	'Stage 17',
	'Stage 19',
	'Stage 21',
	'Stage 23',
	'Stage 25',
	'Stage 27',
	'Stage 28',
}

A_INA = {
	*A_BRIDGE,
	'Sky Palace midboss 2',
	'Demon Lord Castle turret',

	'Random Quest Crystal Falls final boss',
	'Random Quest Demon Lord Castle final boss',

	'Stage 19',
	'Stage 25',
	'Stage 28',
}

A_NO_DEMON = {
	*A_PRQ,
	*A_BRIDGE,
	'Crystal Falls midboss',
	'Crystal Falls final boss',
	'Pirate Harbor boss',
}

A_NO_CHLOE = {
	*A_BRIDGE,
	'Crystal Falls midboss',
	'Pirate Harbor boss',
	'Demon Lord Castle throne room',
	'Demon Lord Castle lift',
	'Demon Lord Castle turret',

	'Random Quest Crystal Falls midboss',
}

#A_ALL = A_SINGLE_SCREEN | A_FLOORED | A_INA

class Drop(Enum):
	ALWAYS = 0
	SETTING = 1
	NOEL = 2
	NEVER = 3

@dataclass
class Boss:
	name: str
	quests: int
	requirements: None | set[str]
	valid_arenas: set[str]
	require_flare: bool = False

	def rule(self, player):
		if self.requirements is not None:
			if self.require_flare:
				requirements = self.requirements
				return lambda state: state.has('Flare', player) and any(state.has(item, player) for item in requirements)
			else:
				requirements = {*self.requirements, 'Noel'}
				return lambda state: any(state.has(item, player) for item in requirements)

Q_NNQ = 1
Q_PRQ = 2
Q_MMQ = 4
Q_ALL = -1

by_name = {boss.name.lower(): boss for boss in [
	Boss('Usadrill', Q_NNQ, None, A_BRIDGE | {'Crystal Falls midboss'}),
	Boss('Pekora', Q_NNQ|Q_MMQ, None, A_ROUGH_FLOORED - A_INA),
	Boss('Veiled Mori', Q_NNQ, None, A_FLOORED & A_WALLED),
	Boss('Miko', Q_NNQ|Q_MMQ, None, A_ROUGH_FLOORED - A_ROOFED),
	Boss('Marine', Q_NNQ, {SHOTS[0], SHOTS[1], SHOTS[5]}, A_SINGLE_SCREEN - (A_FLOORED & A_WALLED) - A_ROOFED, True),
	Boss('Fubura Tower', Q_NNQ, None, {'Yamato midboss 1'}),
	Boss('Ayame', Q_NNQ|Q_MMQ, None, A_CAN_BE_ROOFED),
	Boss('Fubuki', Q_NNQ|Q_PRQ, None, A_ROUGH_FLOORED),
	Boss('Suisei', Q_NNQ|Q_PRQ, None, A_SINGLE_SCREEN - A_ROOFED - A_BRIDGE),
	Boss('Polka', Q_NNQ|Q_MMQ, None, (A_FLOORED & A_SINGLE_SCREEN) | {'Random Quest Underworld Casino game room'}),
	Boss('Demon Lord Miko', Q_NNQ, {SHOTS[2]}, {'Pirate Harbor boss'} | A_WALLED - {'Underworld Casino final boss', 'Demon Lord Castle midboss 2', 'Stage 17'}),
	Boss('Flare', Q_NNQ|Q_PRQ|Q_MMQ, None, A_ROUGH_FLOORED - A_ROOFED),
	Boss('Demon', Q_NNQ, None, A_SINGLE_SCREEN - A_NO_DEMON),
	Boss('Kiara', Q_NNQ|Q_MMQ, {SHOTS[1]}, A_FLOORED & A_WALLED - A_INA, True),
	Boss('Mori', Q_NNQ|Q_PRQ, None, A_FLOORED & A_WALLED - A_ANY_ROOFED - {'Underworld Casino final boss', 'Stage 15'}),
	Boss('Gura', Q_NNQ|Q_PRQ, {SHOTS[1], SHOTS[2], SHOTS[3]}, A_SINGLE_SCREEN),
	Boss('Ina', Q_NNQ|Q_MMQ, {SHOTS[1], SHOTS[3]}, A_INA),
	Boss('Ame', Q_NNQ, {'Time Zone Clock', SHOTS[5]}, A_FLOORED & A_VISIBLY_WALLED & A_SINGLE_SCREEN),
	Boss('Kanata', Q_NNQ|Q_MMQ, {SHOTS[1], SHOTS[2], SHOTS[3], SHOTS[4]}, A_SINGLE_SCREEN),
	Boss('Coco', Q_NNQ, {SHOTS[1], SHOTS[2], SHOTS[3], SHOTS[5]}, A_SINGLE_SCREEN - {'Crystal Falls midboss'} - A_PRQ),
	Boss('Towa', Q_NNQ|Q_MMQ, {SHOTS[5]}, A_CAN_BE_ROOFED & A_FLOORED, True),
	Boss('Robot', Q_PRQ, None, A_ROUGH_FLOORED),
	Boss('Chloe', Q_PRQ, None, (A_WALLED | A_ROUGH_FLOORED) - A_NO_CHLOE),
	Boss('Lui', Q_PRQ|Q_MMQ, None, A_ROUGH_FLOORED),
	Boss('Iroha', Q_PRQ|Q_MMQ, None, A_FLOORED & A_WALLED),
	Boss('La+', Q_PRQ|Q_MMQ, None, A_SINGLE_SCREEN - {'Crystal Falls midboss'}),
	Boss('Koyodrill', Q_PRQ, {SHOTS[2], SHOTS[3]}, A_SINGLE_SCREEN, True),
	Boss('Ghost Marine', Q_MMQ, None, A_CAN_BE_ROOFED & A_SINGLE_SCREEN),
	Boss('Dokuro', Q_MMQ, None, (A_FLOORED & A_SINGLE_SCREEN) - {'Crystal Falls midboss'} - A_PRQ),
]}

class Arena:
	def __init__(self, name, default, region=None, drop=Drop.SETTING):
		self.name = name
		self.fqname = Arena.prefix + name
		self.default = by_name[default.lower()]
		self.region = region
		self.drop = drop
		self.boss = None
	
	def rule(self, player):
		return self.boss.rule(player)
	
	def easy_with(self, character):
		return not self.boss.require_flare if character else self.boss.requirements is None

class HarborArena(Arena):
	def rule(self, player):
		if self.boss.name not in ('Suisei', 'Marine'):
			return lambda state: state.has("Elfriend's feathers", player)
	
	def easy_with(self, _):
		return self.boss.name in ('Suisei', 'Marine')

def allocate_bosses(random, option, arenas, source_quests):
	plando = option.value
	duplicates = None
	try: plando = option.name_lookup[int(plando)]
	except: pass

	banned = []

	for command in plando.lower().split(';'):
		match [sc.strip() for sc in command.split('-')]:
			case ["none"] | ["default"]:
				for arena in arenas:
					if not arena.boss:
						arena.boss = arena.default
			case ["no_duplicates"]:
				if duplicates is not None:
					raise OptionError('Shuffle mode cannot be set multiple times')
				duplicates = False
			case ["allow_duplicates"] | ["chaos"]:
				if duplicates is not None:
					raise OptionError('Shuffle mode cannot be set multiple times')
				duplicates = True
			case ["none", boss_name]:
				try:
					banned.append(by_name[boss_name])
				except KeyError:
					raise OptionError('Unknown boss ' + repr(boss_name))
			case [singularity]:
				try:
					boss = by_name[singularity]
					for arena in arenas:
						if not arena.boss and arena.fqname in boss.valid_arenas:
							arena.boss = boss
				except KeyError:
					raise OptionError('Unknown boss ' + repr(singularity))
			case [arena_name, boss_name]:
				try:
					arena = next(a for a in arenas if a.name.lower() == arena_name)
					if arena.boss:
						raise OptionError('Arena has already been filled by time of ' + repr(command))
					boss = by_name[boss_name]
					if arena.fqname in boss.valid_arenas:
						arena.boss = boss
					else:
						raise OptionError(f'{boss.name} is not compatible with {arena.name}')
				except StopIteration:
					raise OptionError('Unknown arena ' + repr(arena_name))
				except KeyError:
					raise OptionError('Unknown boss ' + repr(boss_name))
			case _:
				raise OptionError('Malformed boss plando command ' + repr(command))

	bosses = [b for b in by_name.values() if b.quests & source_quests and b not in banned]

	if not duplicates:
		bosses = [b for b in bosses if not any(a.boss and b.name == a.boss.name for a in arenas)]

	arenas = [a for a in arenas if not a.boss]

	if not arenas:
		return
	
	if duplicates is None:
		for arena in arenas:
			arena.boss = arena.default
		return
	
	if not duplicates and len(bosses) < len(arenas):
		raise OptionError('Not enough valid bosses to fill all arenas')

	random.shuffle(arenas)
	random.shuffle(bosses)
	allocate_remaining_bosses(arenas, bosses, duplicates, random, 0)

def allocate_remaining_bosses(arenas_, bosses_, duplicates, random, attempt):
	arenas = arenas_[:]
	bosses = bosses_[:]
	#print('Boss allocation attempt %d' % attempt)

	while arenas:
		if not bosses:
			if attempt > 9:
				raise OptionError('Boss randomisation too constrained')
			for arena in arenas_:
				arena.boss = None
			return allocate_remaining_bosses(arenas_, bosses_, duplicates, random, attempt + 1)

		most_constrained_arena = None
		most_constrained_arena_options = 999
		for arena in arenas:
			options = len([b for b in bosses if arena.fqname in b.valid_arenas])
			if options < most_constrained_arena_options:
				most_constrained_arena_options = options
				most_constrained_arena = arena

		if most_constrained_arena_options == 0:
			bosses = None
			continue

		most_constrained_boss = None
		most_constrained_boss_options = 999
		bosses_to_remove = []
		for boss in bosses:
			options = len([a for a in arenas if a.fqname in boss.valid_arenas])
			if options == 0:
				bosses_to_remove.append(boss)
			elif options < most_constrained_boss_options:
				most_constrained_boss_options = options
				most_constrained_boss = boss

		if most_constrained_boss is None:
			bosses = None
			continue

		for boss in bosses_to_remove:
			bosses.remove(boss)

		if duplicates or most_constrained_arena_options <= most_constrained_boss_options or len(bosses) > len(arenas):
			most_constrained_boss = random.choice([b for b in bosses if most_constrained_arena.fqname in b.valid_arenas])
		else:
			most_constrained_arena = random.choice([a for a in arenas if a.fqname in most_constrained_boss.valid_arenas])

		most_constrained_arena.boss = most_constrained_boss
		print(f'Assigned {most_constrained_boss.name} to {most_constrained_arena.fqname}')
		arenas.remove(most_constrained_arena)
		if not duplicates:
			bosses.remove(most_constrained_boss)

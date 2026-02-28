from dataclasses import dataclass
from enum import Enum

from Options import OptionError

from .data import SHOTS

A_FLOORED = {
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
	"Ina's office",
	"Ame's office",
	'Sky Palace secret boss',
	'Sky Palace final boss',
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
}

A_WALLED = {
	*A_VISIBLY_WALLED,
	'Underworld Casino final boss',
	'Pirate Harbor boss',
	'Yamato midboss 3',
	"Mori's office",
	"Ina's office",
	'Sky Palace final boss',
}

A_ROOFED = {
	'Crystal Falls final boss',
	'Yamato midboss 2',
	'Demon Lord Castle midboss 2',
	"Ame's office",
	'Sky Palace final boss',
}

A_CAN_BE_ROOFED = {
	*A_ROOFED,
	'Underworld Casino midboss',
	'Demon Lord Castle throne room',
	"Kiara's office",
	'Sky Palace secret boss',
}

A_SINGLE_SCREEN = {
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
	"Ina's office",
	"Ame's office",
	'Sky Palace midboss 2',
	'Sky Palace secret boss',
	'Sky Palace final boss',
}

A_INA = {
	"Ina's office",
	'Sky Palace midboss 2',
	'Demon Lord Castle turret',
}

A_NO_DEMON = {
	'Crystal Falls midboss',
	'Crystal Falls final boss',
	'Pirate Harbor boss',
	"Ina's office",
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
	quests: set[str]
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

by_name = {boss.name.lower(): boss for boss in [
	Boss('Usadrill', {'nnq'}, None, {'Crystal Falls midboss', "Ina's office"}),
	Boss('Pekora', {'nnq', 'mmq'}, None, A_FLOORED - A_INA),
	Boss('Veiled Mori', {'nnq'}, {SHOTS[0], SHOTS[3], SHOTS[4]}, A_FLOORED & A_WALLED),
	Boss('Miko', {'nnq'}, None, A_FLOORED - A_ROOFED),
	Boss('Marine', {'nnq'}, {SHOTS[0], SHOTS[1], SHOTS[5]}, A_SINGLE_SCREEN - (A_FLOORED & A_WALLED) - A_ROOFED),
	Boss('Fubura Tower', {'nnq'}, None, {'Yamato midboss 1'}),
	Boss('Ayame', {'nnq'}, None, A_CAN_BE_ROOFED),
	Boss('Fubuki', {'nnq'}, None, A_FLOORED),
	Boss('Suisei', {'nnq'}, None, A_SINGLE_SCREEN - A_ROOFED - {"Ina's office"}),
	Boss('Polka', {'nnq'}, None, A_FLOORED & A_SINGLE_SCREEN),
	Boss('Demon Lord Miko', {'nnq'}, {SHOTS[2]}, {'Pirate Harbor boss'} | A_WALLED - {'Underworld Casino final boss', 'Demon Lord Castle midboss 2'}),
	Boss('Flare', {'nnq'}, None, A_FLOORED - A_ROOFED),
	Boss('Demon', {'nnq'}, None, A_SINGLE_SCREEN - A_NO_DEMON),
	Boss('Kiara', {'nnq'}, {SHOTS[1]}, A_FLOORED & A_WALLED - A_INA, True),
	Boss('Mori', {'nnq', 'prq'}, None, A_FLOORED & A_WALLED),
	Boss('Gura', {'nnq'}, {SHOTS[3]}, A_SINGLE_SCREEN),
	Boss('Ina', {'nnq', 'mmq'}, {SHOTS[3]}, A_INA),
	Boss('Ame', {'nnq'}, set(), A_FLOORED & A_VISIBLY_WALLED & A_SINGLE_SCREEN),
	Boss('Kanata', {'nnq'}, {SHOTS[1], SHOTS[2], SHOTS[3]}, A_SINGLE_SCREEN),
	Boss('Coco', {'nnq'}, {SHOTS[1], SHOTS[2], SHOTS[3], SHOTS[5]}, A_SINGLE_SCREEN - {'Crystal Falls midboss'}, True),
	Boss('Towa', {'nnq'}, {SHOTS[5]}, A_CAN_BE_ROOFED, True),
	#Boss('Lui', {'mmq', 'prq'}, None, A_FLOORED),
]}

#ARCADE_MARINE = Boss('Marine', {'a'}, None, A_FW | by_name['marine'].valid_arenas)

class Arena:
	def __init__(self, name, default, region=None, drop=None):
		if drop is None:
			drop = Drop.SETTING if region  else Drop.NEVER
		self.name = name
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
			return lambda state: state.has('Flare', player) and state.has("Elfriend's feathers", player)
	
	def easy_with(self, _):
		return self.boss.name in ('Suisei', 'Marine')

def allocate_bosses(random, option, arenas, source_quests):
	plando = option.value
	duplicates = None
	try: plando = option.name_lookup[int(plando)]
	except: pass

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
			case [singularity]:
				try:
					#boss = ARCADE_MARINE if singularity == 'marine' else by_name[singularity]
					boss = by_name[singularity]
					for arena in arenas:
						if not arena.boss and arena.name in boss.valid_arenas:
							arena.boss = boss
				except KeyError:
					raise OptionError('Unknown boss ' + repr(singularity))
			case [arena_name, boss_name]:
				try:
					arena = next(a for a in arenas if a.name.lower() == arena_name)
					if arena.boss:
						raise OptionError('Arena has already been filled by time of ' + repr(command))
					#boss = ARCADE_MARINE if boss_name == 'marine' else by_name[boss_name]
					boss = by_name[boss_name]
					if arena.name in boss.valid_arenas:
						arena.boss = boss
					else:
						raise OptionError(f'{boss.name} is not compatible with {arena.name}')
				except StopIteration:
					raise OptionError('Unknown arena ' + repr(arena_name))
				except KeyError:
					raise OptionError('Unknown boss ' + repr(boss_name))
			case _:
				raise OptionError('Malformed boss plando command ' + repr(command))

	bosses = [b for b in by_name.values() if b.quests & source_quests]
	#if ARCADE_MARINE.quests & source_quests:
	#	try: bosses.remove(by_name['marine'])
	#	except ValueError: pass
	#	bosses.append(ARCADE_MARINE)

	if not duplicates:
		bosses = [b for b in bosses if not any(a.boss and b.name == a.boss.name for a in arenas)]

	arenas = [a for a in arenas if not a.boss]

	if not arenas:
		return
	
	if duplicates is None:
		for arena in arenas:
			arena.boss = arena.default
		return

	random.shuffle(arenas)
	random.shuffle(bosses)
	allocate_remaining_bosses(arenas, bosses, duplicates, random, 0)

def allocate_remaining_bosses(arenas_, bosses_, duplicates, random, attempt):
	arenas = arenas_[:]
	bosses = bosses_[:]
	print('Boss allocation attempt %d' % attempt)

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
			options = len([b for b in bosses if arena.name in b.valid_arenas])
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
			options = len([a for a in arenas if a.name in boss.valid_arenas])
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
			most_constrained_boss = random.choice([b for b in bosses if most_constrained_arena.name in b.valid_arenas])
		else:
			most_constrained_arena = random.choice([a for a in arenas if a.name in most_constrained_boss.valid_arenas])

		most_constrained_arena.boss = most_constrained_boss
		print(f'Assigned {most_constrained_boss.name} to {most_constrained_arena.name}')
		arenas.remove(most_constrained_arena)
		if not duplicates:
			bosses.remove(most_constrained_boss)

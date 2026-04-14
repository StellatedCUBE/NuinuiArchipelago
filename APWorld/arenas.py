from .boss import Arena, HarborArena, Drop
from .data import MYTH, LEVELS

def nnq_arenas():
	Arena.prefix = ''
	return [
		Arena('Crystal Falls midboss', 'Usadrill', 'nnq_falls_1280_0'),
		Arena('Crystal Falls final boss', 'Pekora', 'nnq_falls_1920_192', Drop.ALWAYS),
		Arena('Underworld Casino midboss', 'Veiled Mori', 'nnq_casino_2560_0'),
		Arena('Underworld Casino final boss', 'Miko', 'nnq_casino_2560_0', Drop.ALWAYS),
		HarborArena('Pirate Harbor boss', 'Marine', 'nnq_port_640_0', Drop.ALWAYS),
		Arena('Yamato midboss 1', 'Fubura Tower', 'nnq_yamato_320_768'),
		Arena('Yamato midboss 2', 'Ayame', 'nnq_yamato_1280_192'),
		Arena('Yamato midboss 3', 'Fubuki', 'nnq_yamato_4480_0', Drop.ALWAYS),
		Arena('Demon Lord Castle midboss 1', 'Suisei', 'nnq_castle_1920_768'),
		Arena('Demon Lord Castle midboss 2', 'Polka', 'nnq_castle_1920_576'),
		Arena('Demon Lord Castle throne room', 'Demon Lord Miko', 'nnq_castle_320_576', Drop.NOEL),
		Arena('Demon Lord Castle lift', 'Flare', 'nnq_castle_320_384'),
		Arena('Demon Lord Castle turret', 'Demon', 'nnq_castle_320_192', Drop.NEVER),
		*(
			Arena(boss + "'s office", boss, 'nnq_hq_' + boss, Drop.NEVER)
			for boss in MYTH
		),
		Arena('Sky Palace midboss 2', 'Kanata', 'nnq_heaven_2560_0', Drop.ALWAYS),
		Arena('Sky Palace secret boss', 'Coco', 'nnq_heaven_2560_1152'),
		Arena('Sky Palace final boss', 'Towa', 'nnq_heaven_0_0', Drop.NEVER)
	]

def prq_arenas():
	Arena.prefix = 'Random Quest '
	return [
		Arena('Crystal Falls midboss', 'Robot', 'prq_' + LEVELS[0]),
		Arena('Crystal Falls final boss', 'Flare', 'prq_' + LEVELS[0], Drop.NEVER),
		Arena('Underworld Casino game room', 'Chloe', 'prq_' + LEVELS[1], Drop.ALWAYS),
		Arena('Underworld Casino final boss', 'Mori', 'prq_' + LEVELS[1], Drop.NEVER),
		Arena('Pirate Harbor midboss', 'Gura', 'prq_' + LEVELS[2]),
		Arena('Pirate Harbor final boss', 'Lui', 'prq_' + LEVELS[2], Drop.NEVER),
		Arena('Yamato midboss', 'Iroha', 'prq_' + LEVELS[3]),
		Arena('Yamato final boss', 'Fubuki', 'prq_' + LEVELS[3], Drop.NEVER),
		Arena('Demon Lord Castle midboss', 'Suisei', 'prq_' + LEVELS[4]),
		Arena('Demon Lord Castle final boss', 'La+', 'prq_' + LEVELS[4], Drop.NEVER),
		Arena('Holo Office', 'Koyodrill', None, Drop.NEVER)
	]

def mmq_arenas():
	Arena.prefix = ''
	return [
		Arena('Stage 03', 'Ghost Marine'),
		Arena('Stage 05', 'Lui'),
		Arena('Stage 07', 'Ina'),
		Arena('Stage 09', 'Iroha'),
		Arena('Stage 11', 'Ayame'),
		Arena('Stage 13', 'Pekora'),
		Arena('Stage 15', 'Miko'),
		Arena('Stage 17', 'Polka'),
		Arena('Stage 19', 'La+'),
		Arena('Stage 21', 'Flare'),
		Arena('Stage 23', 'Kiara'),
		Arena('Stage 25', 'Kanata'),
		Arena('Stage 27', 'Towa'),
		Arena('Stage 28', 'Dokuro')
	]

var rom_info = [
{
"filename":"data/roms/Tetris_[Fran_Dachille,_1991].ch8",
"name":"Tetris",
"keymap":"5:VK_LEFT-6:VK_RIGHT-7:VK_DOWN-4:VK_UP",
"cssname":"x114",
"info":{ "Name": "Tetris", "Author": "Fran Dachille", "Keys": [ ["Up", "rotate"], ["Left", "move left"], ["Right", "move right"], ["Down", "drop faster"] ], "Description": "After every 5 lines, the speed increases slightly and peaks at 45 lines." },
}
,
{
"filename":"data/roms/Blitz_[David_Winter]_(fix).ch8",
"name":"Blitz",
"keymap":"5:VK_SPACE",
"cssname":"xab9",
"info":{ "Name": "Blitz", "Author": "David Winter", "Keys": [ ["Space", "drop a bomb"] ], "Description": "A BOMBER clone where you must destroy the towers. You're flying left to right and loose altitude. The game ends when you crash on a tower..." },
}
,
{
"filename":"data/roms/Sequence_Shoot_[Joyce_Weisbecker].ch8",
"name":"Sequence Shoot",
"keymap":"12:1-13:2-14:3-15:4",
"cssname":"xac0",
"info":{ "Name": "Sequence Shoot", "Author": "Joyce Weisbecker", "Keys": [ ["1", "shoot the uppermost target"], ["2", "shoot the 2nd target"], ["3", "shoot the 3rd target"], ["4", "shoot the lowermost target"] ], "Description": "One of the four targets flashes and the computer waits for you to shoot it. When you press the correct key, you get one point. Then two flash, one after another. Shoot the one that flashed first, then shoot the other. This gives you two more points. Three targets (when hit in the same order as they flashed) add three points to your score. <p />Each time you shoot such a series of targets in proper sequence, your score increases by the number of targets you hit. Every following series you see is longer by one target. The maximum length of a sequence is 22 targets, that is a score of 254. <p />Improper sequencing of shots in any series ends the game." },
}
,
{
"filename":"data/roms/Tic-Tac-Toe_[David_Winter].ch8",
"name":"Tic-Tac-Toe",
"keymap":"1:q-2:w-3:e-4:a-5:s-6:d-7:z-8:x-9:c-1:VK_NUMPAD7-2:VK_NUMPAD8-3:VK_NUMPAD9-4:VK_NUMPAD4-5:VK_NUMPAD5-6:VK_NUMPAD6-7:VK_NUMPAD1-8:VK_NUMPAD2-9:VK_NUMPAD3",
"cssname":"x952",
"info":{ "Name": "Tic-Tac-Toe", "Author": "David Winter", "Keys": [ ["q,w,e or Numpad 7,8,9", "top row"], ["a,s,d or Numpad 4,5,6", "middle row"], ["z,x,c or Numpad 1,2,3", "bottom row"]], "Description": "A Tic-Tac-Toe game. The game restarts when the grid is full." },
}
,
{
"filename":"data/roms/Merlin_[David_Winter].ch8",
"name":"Merlin",
"keymap":"4:VK_NUMPAD4-5:VK_NUMPAD5-7:VK_NUMPAD1-8:VK_NUMPAD2-4:a-5:s-7:z-8:x",
"cssname":"x3d0",
"info":{ "Name": "Merlin", "Author": "David Winter", "Keys": [ ["a,s or Numpad 4,5", "top row"], ["z,x or Numpad 1,2", "bottom row"]], "Description": "The classic Simon game. Remember in which order the squares light. The game begins by lighting only four random squares. Each level adds one square to the sequence. The game ends when you light a wrong square." },
}
,
{
"filename":"data/roms/Guess_[David_Winter]_(alt).ch8",
"name":"Guess",
"keymap":"5:VK_UP-2:VK_DOWN",
"cssname":"xe55",
"info":{ "Name": "Guess", "Author": "David Winter", "Keys": [ ["Up", "if you see the number"], ["Down", "otherwise"]], "Description": "Imagine a number between 1 and 63. CHIP8 shows you seven boards containing a sequence of numbers. Tell him when you see the number by pressing Up (else, Down). The program will then guess your number." },
}
,
{
"filename":"data/roms/Craps_[Camerlo_Cortez,_1978].ch8",
"name":"Craps",
"keymap":"5:VK_SPACE",
"cssname":"x71f",
"info":{ "Name": "Craps", "Author": "Camerlo Cortez", "Keys": [ ["Space", "to role the dice"]], "Description": "7 or 11 wins, 12, 2 or 3 loses on first roll. The second roll must match the first to win, but if you roll a seven you lose." },
}
,
{
"filename":"data/roms/Kaleidoscope_[Joseph_Weisbecker,_1978].ch8",
"name":"Kaleidoscope",
"keymap":"4:VK_LEFT-6:VK_RIGHT-2:VK_UP-8:VK_DOWN-1:VK_SPACE-0:VK_RETURN",
"cssname":"x985",
"info":{ "Name": "Kaleidoscope", "Author": "Joseph Weisbecker", "Keys": [ ["Left", "move left"], ["Right", "move right"], ["Up", "move up"], ["Down", "move down"], ["Space", "erase last move"], ["Enter", "repeat pattern"] ], "Description": "Four spots appear in a group at the center of the screen. Press the arrow keys to create a pattern. Keep your pattern smaller than 138 key depressions. Push the enter key to terminate pattern entry and causes your pattern to be continuously repeated forming a fascinating, changing kaleidoscope display on the screen." },
}
,
{
"filename":"data/roms/Syzygy_[Roy_Trevino,_1990].ch8",
"name":"Syzygy",
"keymap":"7:VK_LEFT-8:VK_RIGHT-3:VK_UP-6:VK_DOWN-15:2-14:1-11:VK_SPACE",
"cssname":"x1d4",
"info":{ "Name": "Syzygy", "Author": "Roy Trevino", "Keys": [ ["1","start game without borders" ], ["2","start game with borders"], ["Left", "move left"], ["Right", "move right"], ["Up", "move up"], ["Down", "move down"], ["Space", "press after having died"] ], "Description": "The object of the game is to seek out \"targets\". You do this with your syzygy. Initially small, the syzygy will grow by some amount each time a target is hit. Eventually, your syzygy will be so long as to make tougher and tougher to get any points (and easier and easier to get killed). Confused? Just try it. <p />Anyways, the syzygy is not allowed to run into anything except targets. It cannot run into the screen border (if present), or itself (this includes backing into itself). Fast and immediate death will result. Don't worry if you die quickly a few times. The keys take a few minutes to get used to. <p /> SYZYGY is (c) copyright 1990 by Roy Trevino (RTT) <p /> Noncommercial distribution allowed, provided that this copyright message is preserved, and any modified versions are clearly marked as such. <p /> SYZYGY, via CHIP-48, makes use of undocumented low-level features of the HP48SX calculator, and may or may not cause loss of data, excessive battery drainage, and/or damage to the calcultor hardware. The Author takes no responsibility whatsoever for any damage caused by the use of this program. <p /> THIS SOFTWARE IS PROVIDED \"AS IS\" AND WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE." },
}
,
{
"filename":"data/roms/Slide_[Joyce_Weisbecker].ch8",
"name":"Slide",
"keymap":"0:VK_SPACE",
"cssname":"x05e",
"info":{ "Name": "Slide", "Author": "Joyce Weisbecker", "Keys": [ ["Space", "stop the puck, (the longer you hold it the faster the puck will move)"] ], "Description": "Slide is a two-person game. Each player tries to slide a \"puck\" over the high-scoring \"spots\" without hitting the back wall.<p />You get 2 points for hitting the first spot, 4 points for either of the next two spots and 8 points for either of the last two. The highest score possible is 216 (two spots can be hit on one slide). If you hit the back wall, though, you get zero points for that slide, even though you've hit a spot. Each player gets 3 pucks per turn and 6 turns in a game." },
}
,
{
"filename":"data/roms/Rocket_Launcher.ch8",
"name":"Rocket Launcher",
"keymap":"15:VK_SPACE",
"cssname":"x2d3",
"info":{ "Name": "Rocket Launcher", "Author": "?", "Keys": [ ["Space", "launch the rocket"] ], "Description": "Not a game? You can launch a rocket though." },
}
,
{
"filename":"data/roms/X-Mirror.ch8",
"name":"X-Mirror",
"keymap":"2:VK_UP-4:VK_LEFT-6:VK_RIGHT-8:VK_DOWN",
"cssname":"x4be",
"info":{ "Name": "X-Mirror", "Author": "?", "Keys": [ ["Left", "move left"], ["Right", "move right"], ["Up", "move up"], ["Down", "move down"] ], "Description": "Everthing you draw is mirrored in the x and y axes." },
}
,
{
"filename":"data/roms/Tank.ch8",
"name":"Tank",
"keymap":"2:VK_DOWN-8:VK_UP-4:VK_LEFT-6:VK_RIGHT-5:VK_SPACE",
"cssname":"xe44",
"info":{},
}
,
{
"filename":"data/roms/Worm_V4_[RB-Revival_Studios,_2007].ch8",
"name":"Worm V4",
"keymap":"2:VK_UP-4:VK_LEFT-6:VK_RIGHT-8:VK_DOWN",
"cssname":"x5d8",
"info":{},
}
,
{
"filename":"data/roms/Airplane.ch8",
"name":"Airplane",
"keymap":"8:VK_SPACE",
"cssname":"x541",
"info":{},
}
,
{
"filename":"data/roms/Coin_Flipping_[Carmelo_Cortez,_1978].ch8",
"name":"Coin Flipping",
"keymap":"",
"cssname":"x127",
"info":{},
}
,
{
"filename":"data/roms/Vertical_Brix_[Paul_Robson,_1996].ch8",
"name":"Vertical Brix*",
"keymap":"",
"cssname":"xa65",
"info":{},
}
,
{
"filename":"data/roms/Tapeworm_[JDR,_1999].ch8",
"name":"Tapeworm",
"keymap":"15:VK_SPACE-2:VK_UP-4:VK_LEFT-6:VK_RIGHT-8:VK_DOWN",
"cssname":"x355",
"info":{},
}
,
{
"filename":"data/roms/Astro_Dodge_[Revival_Studios,_2008].ch8",
"name":"Astro Dodge",
"keymap":"5:VK_SPACE-2:VK_UP-4:VK_LEFT-6:VK_RIGHT-8:VK_DOWN",
"cssname":"xaf2",
"info":{},
}
,
{
"filename":"data/roms/Blinky_[Hans_Christian_Egeberg]_(alt).ch8",
"name":"Blinky",
"keymap":"2:VK_UP-8:VK_DOWN-4:VK_LEFT-6:VK_RIGHT",
"cssname":"x837",
"info":{},
}
,
{
"filename":"data/roms/Squash_[David_Winter].ch8",
"name":"Squash",
"keymap":"1:VK_UP-4:VK_DOWN",
"cssname":"x999",
"info":{},
}
,
{
"filename":"data/roms/Breakout_[Carmelo_Cortez,_1979].ch8",
"name":"Breakout",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"xd89",
"info":{},
}
,
{
"filename":"data/roms/UFO_[Lutz_V,_1992].ch8",
"name":"UFO",
"keymap":"4:VK_LEFT-5:VK_UP-6:VK_RIGHT",
"cssname":"xb05",
"info":{},
}
,
{
"filename":"data/roms/Timebomb.ch8",
"name":"Timebomb",
"keymap":"2:VK_UP-8:VK_DOWN-5:VK_SPACE",
"cssname":"xbb3",
"info":{},
}
,
{
"filename":"data/roms/Rocket_[Joseph_Weisbecker,_1978].ch8",
"name":"Rocket",
"keymap":"15:VK_SPACE",
"cssname":"xdee",
"info":{},
}
,
{
"filename":"data/roms/Hi-Lo_[Jef_Winsor,_1978].ch8",
"name":"Hi-Lo",
"keymap":"1:1-2:2-3:3-4:4-5:5-6:6-7:7-8:8-9:9-0:0-10:VK_SPACE",
"cssname":"x0a8",
"info":{},
}
,
{
"filename":"data/roms/Russian_Roulette_[Carmelo_Cortez,_1978].ch8",
"name":"Russian Roulette",
"keymap":"1:VK_SPACE",
"cssname":"x331",
"info":{},
}
,
{
"filename":"data/roms/Soccer.ch8",
"name":"Soccer",
"keymap":"1:w-4:s-12:VK_UP-13:VK_DOWN",
"cssname":"x871",
"info":{},
}
,
{
"filename":"data/roms/Rush_Hour_[Hap,_2006]_(alt).ch8",
"name":"Rush Hour*",
"keymap":"",
"cssname":"x5d6",
"info":{},
}
,
{
"filename":"data/roms/Biorhythm_[Jef_Winsor].ch8",
"name":"Biorhythm",
"keymap":"1:1-2:2-3:3-4:4-5:5-6:6-7:7-8:8-9:9-0:0-11:VK_DOWN-15:VK_UP",
"cssname":"x005",
"info":{},
}
,
{
"filename":"data/roms/Shooting_Stars_[Philip_Baltzer,_1978].ch8",
"name":"Shooting Stars",
"keymap":"2:VK_UP-4:VK_LEFT-6:VK_RIGHT-8:VK_DOWN",
"cssname":"xc8b",
"info":{},
}
,
{
"filename":"data/roms/Nim_[Carmelo_Cortez,_1978].ch8",
"name":"Nim",
"keymap":"15:VK_SPACE-1:1-2:2-3:3",
"cssname":"x230",
"info":{},
}
,
{
"filename":"data/roms/Pong_2_(Pong_hack)_[David_Winter,_1997].ch8",
"name":"Pong 2",
"keymap":"1:w-4:s-12:VK_UP-13:VK_DOWN",
"cssname":"x30c",
"info":{},
}
,
{
"filename":"data/roms/Wall_[David_Winter].ch8",
"name":"Wall",
"keymap":"1:VK_UP-4:VK_DOWN",
"cssname":"xc81",
"info":{},
}
,
{
"filename":"data/roms/Reversi_[Philip_Baltzer].ch8",
"name":"Reversi",
"keymap":"1:VK_NUMPAD7-2:VK_NUMPAD8-3:VK_NUMPAD9-4:VK_NUMPAD4-5:VK_NUMPAD5-6:VK_NUMPAD6-7:VK_NUMPAD1-8:VK_NUMPAD2-9:VK_NUMPAD3-1:q-2:w-3:e-4:a-5:s-6:d-7:z-8:x-9:c-5:VK_SPACE",
"cssname":"x544",
"info":{},
}
,
{
"filename":"data/roms/Space_Intercept_[Joseph_Weisbecker,_1978].ch8",
"name":"Space Intercept",
"keymap":"1:1-2:2-4:VK_LEFT-5:VK_UP-6:VK_RIGHT",
"cssname":"xeed",
"info":{},
}
,
{
"filename":"data/roms/ZeroPong_[zeroZshadow,_2007].ch8",
"name":"ZeroPong",
"keymap":"15:VK_SPACE-10:s-11:w-2:VK_UP-8:VK_DOWN",
"cssname":"xb8c",
"info":{},
}
,
{
"filename":"data/roms/Vers_[JMN,_1991].ch8",
"name":"Vers",
"keymap":"12:VK_UP-13:VK_DOWN-15:VK_RIGHT-11:VK_LEFT-1:a-2:d-7:w-10-s",
"cssname":"xb49",
"info":{},
}
,
{
"filename":"data/roms/Figures.ch8",
"name":"Figures",
"keymap":"4:VK_LEFT-6:VK_RIGHT-2:VK_SPACE",
"cssname":"xb36",
"info":{},
}
,
{
"filename":"data/roms/Lunar_Lander_(Udo_Pernisz,_1979).ch8",
"name":"Lunar Lander",
"keymap":"1:1-2:2-3:3-2:VK_SPACE-4:VK_LEFT-6:VK_RIGHT",
"cssname":"x85d",
"info":{},
}
,
{
"filename":"data/roms/Pong_(1_player).ch8",
"name":"Pong",
"keymap":"1:VK_UP-4:VK_DOWN",
"cssname":"x99d",
"info":{},
}
,
{
"filename":"data/roms/Tron.ch8",
"name":"Tron",
"keymap":"11:1-15:2-0:VK_SPACE-1:w-4:s-12:d-3:a-7:VK_UP-9:VK_LEFT-10:VK_DOWN-14:VK_RIGHT",
"cssname":"x8f6",
"info":{},
}
,
{
"filename":"data/roms/Connect_4_[David_Winter].ch8",
"name":"Connect 4",
"keymap":"4:VK_LEFT-6:VK_RIGHT-5:VK_SPACE",
"cssname":"x207",
"info":{},
}
,
{
"filename":"data/roms/Landing.ch8",
"name":"Landing",
"keymap":"8:VK_SPACE",
"cssname":"x41b",
"info":{},
}
,
{
"filename":"data/roms/Brick_(Brix_hack,_1990).ch8",
"name":"Brick",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"xd41",
"info":{},
}
,
{
"filename":"data/roms/Brix_[Andreas_Gustafsson,_1990].ch8",
"name":"Brix",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"x502",
"info":{},
}
,
{
"filename":"data/roms/Submarine_[Carmelo_Cortez,_1978].ch8",
"name":"Submarine",
"keymap":"5:VK_SPACE",
"cssname":"x9fd",
"info":{},
}
,
{
"filename":"data/roms/Wipe_Off_[Joseph_Weisbecker].ch8",
"name":"Wipe Off",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"xa6c",
"info":{},
}
,
{
"filename":"data/roms/Sum_Fun_[Joyce_Weisbecker].ch8",
"name":"Sum Fun",
"keymap":"1:1-2:2-3:3-4:4-5:5-6:6-7:7-8:8-9:9-0:0",
"cssname":"x9cf",
"info":{},
}
,
{
"filename":"data/roms/Puzzle.ch8",
"name":"Puzzle",
"keymap":"2:VK_DOWN-4:VK_LEFT-6:VK_RIGHT-8:VK_UP",
"cssname":"x2b1",
"info":{},
}
,
{
"filename":"data/roms/Spooky_Spot_[Joseph_Weisbecker,_1978].ch8",
"name":"Spooky Spot",
"keymap":"0:VK_SPACE",
"cssname":"x6ae",
"info":{},
}
,
{
"filename":"data/roms/Pong_(alt).ch8",
"name":"Pong",
"keymap":"1:w-4:s-12:VK_UP-13:VK_DOWN",
"cssname":"x1a9",
"info":{},
}
,
{
"filename":"data/roms/Bowling_[Gooitzen_van_der_Wal].ch8",
"name":"Bowling",
"keymap":"1:1-2:2-3:3-4:4-5:5-6:6-7:7-8:8-9:9-0:0",
"cssname":"xe1d",
"info":{},
}
,
{
"filename":"data/roms/Addition_Problems_[Paul_C._Moews].ch8",
"name":"Addition Problems",
"keymap":"1:1-2:2-3:3-4:4-5:5-6:6-7:7-8:8-9:9-0:0",
"cssname":"xf45",
"info":{},
}
,
{
"filename":"data/roms/Paddles.ch8",
"name":"Paddles",
"keymap":"14:2-15:1-4:VK_LEFT-6:VK_RIGHT-7:a-9:d",
"cssname":"xb2a",
"info":{},
}
,
{
"filename":"data/roms/Space_Flight.ch8",
"name":"Space Flight",
"keymap":"1:VK_UP-4:VK_DOWN-15:VK_SPACE-14:VK_RETURN",
"cssname":"xd6e",
"info":{},
}
,
{
"filename":"data/roms/Rocket_Launch_[Jonas_Lindstedt].ch8",
"name":"Rocket Launch",
"keymap":"4:VK_LEFT-6:VK_RIGHT-11:VK_SPACE",
"cssname":"x839",
"info":{},
}
,
{
"filename":"data/roms/Pong_[Paul_Vervalin,_1990].ch8",
"name":"Pong",
"keymap":"1:w-4:s-12:VK_UP-13:VK_DOWN",
"cssname":"x842",
"info":{},
}
,
{
"filename":"data/roms/Breakout_(Brix_hack)_[David_Winter,_1997].ch8",
"name":"Breakout",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"xed3",
"info":{ "Name": "Breakout", "Author": "David Winter", "Keys": [ ["Left", "move left"], ["Right", "move right"] ], "Description": "A modified BRIX with graphics looking like the game on the Atari 2600 console." },
}
,
{
"filename":"data/roms/Space_Invaders_[David_Winter]_(alt).ch8",
"name":"Space Invaders",
"keymap":"5:VK_SPACE-4:VK_LEFT-6:VK_RIGHT",
"cssname":"x128",
"info":{},
}
,
{
"filename":"data/roms/Filter.ch8",
"name":"Filter",
"keymap":"4:VK_LEFT-6:VK_RIGHT",
"cssname":"xd77",
"info":{},
}
,
{
"filename":"data/roms/Hidden_[David_Winter,_1996].ch8",
"name":"Hidden",
"keymap":"8:VK_DOWN-4:VK_LEFT-5:VK_SPACE-6:VK_RIGHT-2:VK_UP",
"cssname":"xacd",
"info":{},
}
,
];

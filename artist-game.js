(function (root) {
  'use strict';

  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’ʼ`´.]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const slugify = (s) => norm(s).replace(/ /g, '-');

  const COUNTRY_NAMES = {
    US: 'USA',
    UK: 'UK',
    CA: 'Canada',
    AU: 'Australia',
    SE: 'Sweden',
    FR: 'France',
    IE: 'Ireland',
    BB: 'Barbados',
    CO: 'Colombia',
    PR: 'Puerto Rico',
    NZ: 'New Zealand',
    NO: 'Norway',
    JM: 'Jamaica',
    NL: 'Netherlands',
    DE: 'Germany',
    BE: 'Belgium',
    ES: 'Spain',
    KR: 'South Korea',
    IS: 'Iceland',
    TT: 'Trinidad'
  };

  /**
   * 250 iconic global artists present in songs.js.
   * Columns: [name, debutYear, type ('Solo'|'Duo'|'Group'), membersCount, gender ('Male'|'Female'|'Mixed'), genre, countryCode, continent, rank]
   */
  const RAW_ROSTER = [
    ['The Weeknd', 2011, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 1],
    ['Taylor Swift', 2006, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 2],
    ['Ed Sheeran', 2011, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 3],
    ['Drake', 2009, 'Solo', 1, 'Male', 'Hip-hop', 'CA', 'North America', 4],
    ['Post Malone', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 5],
    ['Bruno Mars', 2010, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 6],
    ['Billie Eilish', 2016, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 7],
    ['Coldplay', 2000, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 8],
    ['Arctic Monkeys', 2006, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 9],
    ['Imagine Dragons', 2012, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 10],
    ['Harry Styles', 2017, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 11],
    ['The Neighbourhood', 2012, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 12],
    ['Justin Bieber', 2009, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 13],
    ['Dua Lipa', 2015, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 14],
    ['Eminem', 1999, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 15],
    ['Ariana Grande', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 16],
    ['Rihanna', 2005, 'Solo', 1, 'Female', 'Pop', 'BB', 'North America', 17],
    ['Queen', 1973, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 18],
    ['Linkin Park', 2000, 'Group', 6, 'Mixed', 'Rock', 'US', 'North America', 19],
    ['Michael Jackson', 1972, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 20],
    ['Kendrick Lamar', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 21],
    ['Travis Scott', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 22],
    ['Shawn Mendes', 2014, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 23],
    ['Lady Gaga', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 24],
    ['OneRepublic', 2007, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 25],
    ['Hozier', 2013, 'Solo', 1, 'Male', 'Indie', 'IE', 'Europe', 26],
    ['The Killers', 2004, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 27],
    ['The Chainsmokers', 2012, 'Duo', 2, 'Male', 'Electronic', 'US', 'North America', 28],
    ['Radiohead', 1992, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 29],
    ['Twenty One Pilots', 2009, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 30],
    ['Sabrina Carpenter', 2015, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 31],
    ['Olivia Rodrigo', 2021, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 32],
    ['Maroon 5', 2002, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 33],
    ['SZA', 2014, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 34],
    ['Adele', 2008, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 35],
    ['Lana Del Rey', 2011, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 36],
    ['Doja Cat', 2018, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 37],
    ['Miley Cyrus', 2007, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 38],
    ['Nirvana', 1989, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 39],
    ['Oasis', 1994, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 40],
    ['Avicii', 2011, 'Solo', 1, 'Male', 'Electronic', 'SE', 'Europe', 41],
    ['One Direction', 2011, 'Group', 5, 'Male', 'Pop', 'UK', 'Europe', 42],
    ['Fleetwood Mac', 1968, 'Group', 5, 'Mixed', 'Rock', 'UK', 'Europe', 43],
    ['Sam Smith', 2013, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 44],
    ['Calvin Harris', 2007, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 45],
    ['Tame Impala', 2010, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 46],
    ['Gorillaz', 2001, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 47],
    ['Sia', 2000, 'Solo', 1, 'Female', 'Pop', 'AU', 'Oceania', 48],
    ['Katy Perry', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 49],
    ['Kanye West', 2004, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 50],
    ['Lewis Capaldi', 2017, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 51],
    ['The Kid LAROI', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'AU', 'Oceania', 52],
    ['Vance Joy', 2013, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 53],
    ['Glass Animals', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 54],
    ['The Police', 1978, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 55],
    ['Camila Cabello', 2017, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 56],
    ['John Legend', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 57],
    ['Juice WRLD', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 58],
    ['Benson Boone', 2021, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 59],
    ['a-ha', 1984, 'Group', 3, 'Male', 'Pop', 'NO', 'Europe', 60],
    ['Charlie Puth', 2015, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 61],
    ['Keane', 2004, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 62],
    ['Shakira', 1995, 'Solo', 1, 'Female', 'Pop', 'CO', 'Latin America', 63],
    ['Bastille', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 64],
    ['Zara Larsson', 2013, 'Solo', 1, 'Female', 'Pop', 'SE', 'Europe', 65],
    ['Cigarettes After Sex', 2012, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 66],
    ['Foster the People', 2010, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 67],
    ['Halsey', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 68],
    ['Bad Bunny', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 69],
    ['Jason Mraz', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 70],
    ['Mariah Carey', 1990, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 71],
    ['Wiz Khalifa', 2008, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 72],
    ['David Guetta', 2002, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 73],
    ['Alan Walker', 2015, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 74],
    ['Earth, Wind & Fire', 1971, 'Group', 7, 'Male', 'R&B', 'US', 'North America', 75],
    ['Bon Jovi', 1984, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 76],
    ['Tate McRae', 2019, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 77],
    ['Eagles', 1972, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 78],
    ['Lil Nas X', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 79],
    ['Kings of Leon', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 80],
    ['Chappell Roan', 2020, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 81],
    ['Black Eyed Peas', 1998, 'Group', 4, 'Mixed', 'Pop', 'US', 'North America', 82],
    ['The White Stripes', 1999, 'Duo', 2, 'Mixed', 'Rock', 'US', 'North America', 83],
    ['Frank Ocean', 2011, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 84],
    ['Daniel Caesar', 2014, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 85],
    ['Metallica', 1983, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 86],
    ['50 Cent', 2003, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 87],
    ['Evanescence', 2003, 'Group', 5, 'Mixed', 'Rock', 'US', 'North America', 88],
    ['Backstreet Boys', 1995, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 89],
    ['Usher', 1994, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 90],
    ['Red Hot Chili Peppers', 1984, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 91],
    ['System Of A Down', 1998, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 92],
    ['ABBA', 1972, 'Group', 4, 'Mixed', 'Pop', 'SE', 'Europe', 93],
    ['Future', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 94],
    ['Khalid', 2016, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 95],
    ['Green Day', 1990, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 96],
    ['Daft Punk', 1997, 'Duo', 2, 'Male', 'Electronic', 'FR', 'Europe', 97],
    ['Paramore', 2005, 'Group', 3, 'Mixed', 'Rock', 'US', 'North America', 98],
    ['Lorde', 2013, 'Solo', 1, 'Female', 'Indie', 'NZ', 'Oceania', 99],
    ['Childish Gambino', 2011, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 100],
    ['Karol G', 2014, 'Solo', 1, 'Female', 'Pop', 'CO', 'Latin America', 101],
    ['Pitbull', 2004, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 102],
    ['Rauw Alejandro', 2016, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 103],
    ['AC/DC', 1975, 'Group', 5, 'Male', 'Rock', 'AU', 'Oceania', 104],
    ["Guns N' Roses", 1987, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 105],
    ['Maluma', 2012, 'Solo', 1, 'Male', 'Pop', 'CO', 'Latin America', 106],
    ['J. Cole', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 107],
    ['Beyoncé', 2003, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 108],
    ['James Arthur', 2012, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 109],
    ['Morgan Wallen', 2016, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 110],
    ['Flo Rida', 2007, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 111],
    ['J Balvin', 2010, 'Solo', 1, 'Male', 'Pop', 'CO', 'Latin America', 112],
    ['Selena Gomez', 2009, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 113],
    ['DJ Snake', 2013, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 114],
    ['Clean Bandit', 2012, 'Group', 3, 'Mixed', 'Electronic', 'UK', 'Europe', 115],
    ['Britney Spears', 1998, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 116],
    ['Chris Brown', 2005, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 117],
    ['Lil Uzi Vert', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 118],
    ['Major Lazer', 2009, 'Group', 3, 'Male', 'Electronic', 'US', 'North America', 119],
    ['The Beatles', 1962, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 120],
    ['Cardi B', 2017, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 121],
    ['P!nk', 2000, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 122],
    ['Ozuna', 2016, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 123],
    ['Jason Derulo', 2009, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 124],
    ['Lil Wayne', 1999, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 125],
    ['The Script', 2008, 'Group', 3, 'Male', 'Pop', 'IE', 'Europe', 126],
    ['Creedence Clearwater Revival', 1968, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 127],
    ['Daddy Yankee', 2004, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 128],
    ['Kygo', 2014, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 129],
    ['Marshmello', 2015, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 130],
    ['Joji', 2017, 'Solo', 1, 'Male', 'R&B', 'AU', 'Oceania', 131],
    ['The Rolling Stones', 1963, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 132],
    ['Justin Timberlake', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 133],
    ['Elton John', 1969, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 134],
    ['Sean Paul', 2000, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 135],
    ['2Pac', 1991, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 136],
    ['Billy Joel', 1971, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 137],
    ['Cyndi Lauper', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 138],
    ['Steve Lacy', 2017, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 139],
    ['Teddy Swims', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 140],
    ['Nelly Furtado', 2000, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 141],
    ['Alicia Keys', 2001, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 142],
    ['d4vd', 2022, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 143],
    ['Fall Out Boy', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 144],
    ['Train', 1998, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 145],
    ['Foo Fighters', 1995, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 146],
    ['Dr. Dre', 1992, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 147],
    ['Bee Gees', 1967, 'Group', 3, 'Male', 'Pop', 'UK', 'Europe', 148],
    ['The Cranberries', 1993, 'Group', 4, 'Mixed', 'Rock', 'IE', 'Europe', 149],
    ['The Notorious B.I.G.', 1994, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 150],
    ['Panic! At The Disco', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 151],
    ['Lost Frequencies', 2014, 'Solo', 1, 'Male', 'Electronic', 'BE', 'Europe', 152],
    ['Toto', 1978, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 153],
    ['Zedd', 2012, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 154],
    ['U2', 1980, 'Group', 4, 'Male', 'Rock', 'IE', 'Europe', 155],
    ['Mark Ronson', 2003, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 156],
    ['Mitski', 2012, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 157],
    ['Gracie Abrams', 2019, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 158],
    ['Zach Bryan', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 159],
    ['Kelly Clarkson', 2002, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 160],
    ['Miguel', 2010, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 161],
    ['JAY-Z', 1996, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 162],
    ['Meghan Trainor', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 163],
    ['Amy Winehouse', 2003, 'Solo', 1, 'Female', 'R&B', 'UK', 'Europe', 164],
    ['A$AP Rocky', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 165],
    ['Bryan Adams', 1980, 'Solo', 1, 'Male', 'Rock', 'CA', 'North America', 166],
    ['Dire Straits', 1978, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 167],
    ['Enrique Iglesias', 1995, 'Solo', 1, 'Male', 'Pop', 'ES', 'Europe', 168],
    ['blink-182', 1995, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 169],
    ['Demi Lovato', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 170],
    ['Ellie Goulding', 2010, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 171],
    ['OutKast', 1994, 'Duo', 2, 'Male', 'Hip-hop', 'US', 'North America', 172],
    ['Wham!', 1982, 'Duo', 2, 'Male', 'Pop', 'UK', 'Europe', 173],
    ['Ava Max', 2018, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 174],
    ['Lynyrd Skynyrd', 1973, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 175],
    ['The Lumineers', 2012, 'Group', 2, 'Male', 'Indie', 'US', 'North America', 176],
    ['Pink Floyd', 1967, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 177],
    ['Ruth B.', 2015, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 178],
    ['MGMT', 2007, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 179],
    ['Don Toliver', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 180],
    ['Tiësto', 2001, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 181],
    ['Luis Fonsi', 1998, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 182],
    ['My Chemical Romance', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 183],
    ['Madonna', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 184],
    ['Dominic Fike', 2018, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 185],
    ['Led Zeppelin', 1969, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 186],
    ['XXXTENTACION', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 187],
    ['The Cure', 1979, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 188],
    ['Ne-Yo', 2006, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 189],
    ['Aerosmith', 1973, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 190],
    ['Swedish House Mafia', 2010, 'Group', 3, 'Male', 'Electronic', 'SE', 'Europe', 191],
    ['Avril Lavigne', 2002, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 192],
    ['Kesha', 2009, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 193],
    ['Empire of the Sun', 2008, 'Duo', 2, 'Male', 'Electronic', 'AU', 'Oceania', 194],
    ['Djo', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 195],
    ['Michael Bublé', 2003, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 196],
    ['Journey', 1975, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 197],
    ['Slipknot', 1999, 'Group', 9, 'Male', 'Rock', 'US', 'North America', 198],
    ['Passenger', 2012, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 199],
    ['Nicki Minaj', 2010, 'Solo', 1, 'Female', 'Hip-hop', 'TT', 'North America', 200],
    ['Nelly', 2000, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 201],
    ['Fifth Harmony', 2013, 'Group', 5, 'Female', 'Pop', 'US', 'North America', 202],
    ['George Ezra', 2013, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 203],
    ['The Smiths', 1983, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 204],
    ['Migos', 2013, 'Group', 3, 'Male', 'Hip-hop', 'US', 'North America', 205],
    ['DaBaby', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 206],
    ['Nickelback', 1996, 'Group', 4, 'Male', 'Rock', 'CA', 'North America', 207],
    ['Noah Kahan', 2017, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 208],
    ['Jack Johnson', 2001, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 209],
    ['Gotye', 2006, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 210],
    ['Chris Stapleton', 2015, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 211],
    ['The Fray', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 212],
    ['Little Mix', 2011, 'Group', 4, 'Female', 'Pop', 'UK', 'Europe', 213],
    ['Pearl Jam', 1991, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 214],
    ['The Strokes', 2001, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 215],
    ['Florence + The Machine', 2009, 'Group', 7, 'Mixed', 'Indie', 'UK', 'Europe', 216],
    ['Cage The Elephant', 2008, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 217],
    ['Disclosure', 2012, 'Duo', 2, 'Male', 'Electronic', 'UK', 'Europe', 218],
    ['George Michael', 1984, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 219],
    ['3 Doors Down', 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 220],
    ['JVKE', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 221],
    ['B.o.B', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 222],
    ['Taio Cruz', 2008, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 223],
    ['Bebe Rexha', 2015, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 224],
    ['Niall Horan', 2016, 'Solo', 1, 'Male', 'Pop', 'IE', 'Europe', 225],
    ['Shaggy', 1993, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 226],
    ['Galantis', 2013, 'Duo', 2, 'Male', 'Electronic', 'SE', 'Europe', 227],
    ['Bruce Springsteen', 1973, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 228],
    ['Disturbed', 2000, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 229],
    ['Gwen Stefani', 2004, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 230],
    ['Akon', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 231],
    ['Marvin Gaye', 1961, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 232],
    ['Dolly Parton', 1967, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 233],
    ['Muse', 1999, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 234],
    ['Anne-Marie', 2015, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 235],
    ['Snow Patrol', 1998, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 236],
    ['Zayn', 2016, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 237],
    ['TLC', 1992, 'Group', 3, 'Female', 'R&B', 'US', 'North America', 238],
    ['JENNIE', 2018, 'Solo', 1, 'Female', 'Pop', 'KR', 'Asia', 239],
    ['Beach House', 2006, 'Duo', 2, 'Mixed', 'Indie', 'US', 'North America', 240],
    ['Whitney Houston', 1985, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 241],
    ['Jonas Brothers', 2006, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 242],
    ['Aretha Franklin', 1960, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 243],
    ['David Bowie', 1969, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 244],
    ['Spice Girls', 1996, 'Group', 5, 'Female', 'Pop', 'UK', 'Europe', 245],
    ['Martin Garrix', 2013, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 246],
    ['Elvis Presley', 1954, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 247],
    ['The 1975', 2013, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 248],
    ['Depeche Mode', 1981, 'Group', 3, 'Male', 'Electronic', 'UK', 'Europe', 249],
    ['Prince', 1978, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 250]
  ];

  function buildRoster(songs = [], streamsData = null) {
    const streamsMap = new Map();
    const items = (streamsData && streamsData.items) || [];
    for (const pair of items) {
      if (Array.isArray(pair) && pair[0]) streamsMap.set(Number(pair[0]), Number(pair[1]));
    }

    const byNormArtist = new Map();
    for (const s of (songs || [])) {
      if (!s) continue;
      const title = s.title || s[0];
      const artist = s.artist || s[1];
      const tier = s.tier || s[2] || 3;
      const year = s.year || s[5] || 0;
      const art = s.art || s[6] || '';
      const trackId = Number(s.trackId || s[7] || 0);
      if (!title || !artist || !art || !trackId) continue;
      const key = norm(artist);
      if (!byNormArtist.has(key)) byNormArtist.set(key, []);
      byNormArtist.get(key).push({
        title,
        artist,
        tier,
        year,
        art,
        trackId,
        streams: streamsMap.get(trackId) || 0,
        slug: s.slug || slugify(title + ' ' + artist)
      });
    }

    const out = [];
    for (const r of RAW_ROSTER) {
      const name = r[0];
      const key = norm(name);
      let tracks = byNormArtist.get(key) || [];
      if (!tracks.length) {
        for (const [k, list] of byNormArtist.entries()) {
          if (k.includes(key) || key.includes(k)) {
            tracks = list;
            break;
          }
        }
      }
      if (!tracks.length) continue;
      tracks.sort((a, b) => (b.streams - a.streams) || (a.tier - b.tier));
      const topSong = tracks[0];
      const hintSong = tracks[1] || tracks[0];
      out.push({
        id: slugify(name),
        name,
        debut: r[1],
        type: r[2],
        members: r[3],
        gender: r[4],
        genre: r[5],
        countryCode: r[6],
        country: COUNTRY_NAMES[r[6]] || r[6],
        continent: r[7],
        rank: r[8],
        art: topSong.art,
        topSong,
        hintSong,
        hay: key
      });
    }
    return out;
  }

  function compare(guess, target) {
    if (!guess || !target) return [];
    const yrDiff = Math.abs(guess.debut - target.debut);
    const yrArrow = guess.debut === target.debut ? '' : (target.debut > guess.debut ? ' ▲' : ' ▼');
    const debutTile = {
      key: 'debut',
      label: 'Debut',
      value: guess.debut + yrArrow,
      status: yrDiff === 0 ? 'exact' : (yrDiff <= 5 ? 'close' : 'miss')
    };

    const typeLabel = guess.type === 'Solo' ? 'Solo' : `${guess.type} (${guess.members})`;
    const sameCategory = (guess.members === 1 && target.members === 1) || (guess.members > 1 && target.members > 1);
    const membersTile = {
      key: 'members',
      label: 'Type',
      value: typeLabel,
      status: (guess.type === target.type && guess.members === target.members)
        ? 'exact'
        : (sameCategory ? 'close' : 'miss')
    };

    const genderTile = {
      key: 'gender',
      label: 'Gender',
      value: guess.gender,
      status: guess.gender === target.gender ? 'exact' : 'miss'
    };

    const genreTile = {
      key: 'genre',
      label: 'Genre',
      value: guess.genre,
      status: guess.genre === target.genre ? 'exact' : 'miss'
    };

    const countryTile = {
      key: 'country',
      label: 'Country',
      value: guess.country,
      status: guess.country === target.country
        ? 'exact'
        : (guess.continent === target.continent ? 'close' : 'miss')
    };

    const rkDiff = Math.abs(guess.rank - target.rank);
    const rkArrow = guess.rank === target.rank ? '' : (target.rank < guess.rank ? ' ▲' : ' ▼');
    const rankTile = {
      key: 'rank',
      label: 'Rank',
      value: '#' + guess.rank + rkArrow,
      status: rkDiff === 0 ? 'exact' : (rkDiff <= 15 ? 'close' : 'miss')
    };

    return [debutTile, membersTile, genderTile, genreTile, countryTile, rankTile];
  }

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const ID_TO_CODE = new Map();
  const CODE_TO_ID = new Map();
  for (const r of RAW_ROSTER) {
    const id = slugify(r[0]);
    const code = hashStr('tl:ag:v1:' + id).toString(36);
    ID_TO_CODE.set(id, code);
    CODE_TO_ID.set(code, id);
  }

  function dailyArtist(roster, dateStr) {
    if (!Array.isArray(roster) || !roster.length) return null;
    const cleanDate = String(dateStr || '2026-01-01');
    const idx = hashStr('tl:artist:daily:' + cleanDate) % roster.length;
    return roster[idx];
  }

  function createChallenge(baseUrl, { id = '', tries = 0, won = false } = {}) {
    const cleanUrl = String(baseUrl || '').split('#')[0];
    const cleanId = slugify(id);
    const code = ID_TO_CODE.get(cleanId) || (CODE_TO_ID.has(cleanId) ? cleanId : '');
    if (!cleanUrl || !code) return '';
    const resCode = won && tries >= 1 && tries <= 10 ? String(Math.floor(tries)) : 'x';
    return cleanUrl + '#artist=1.' + code + '.' + resCode;
  }

  function parseChallenge(raw) {
    let token = String(raw || '').trim();
    const hashIdx = token.indexOf('#artist=');
    if (hashIdx >= 0) token = token.slice(hashIdx + 8);
    else if (token.startsWith('artist=')) token = token.slice(7);
    else return null;
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== '1') return null;
    const rawKey = parts[1];
    const resCode = parts[2];
    const id = CODE_TO_ID.get(rawKey) || (ID_TO_CODE.has(rawKey) ? rawKey : '');
    if (!id) return null;
    if (resCode !== 'x' && !/^(?:[1-9]|10)$/.test(resCode)) return null;
    return {
      version: 1,
      id,
      won: resCode !== 'x',
      tries: resCode === 'x' ? 0 : Number(resCode)
    };
  }

  function compareChallenge(friendWon, friendTries, yourWon, yourTries) {
    if (yourWon && !friendWon) return 'You solved it — your friend missed!';
    if (!yourWon && friendWon) return 'Your friend solved it in ' + friendTries + (friendTries === 1 ? ' try.' : ' tries.');
    if (!yourWon && !friendWon) return 'Both of you were stumped!';
    const diff = friendTries - yourTries;
    if (diff > 0) return 'You beat your friend by ' + diff + (diff === 1 ? ' try!' : ' tries!');
    if (diff < 0) return 'Solved ' + Math.abs(diff) + (Math.abs(diff) === 1 ? ' try' : ' tries') + ' after your friend.';
    return 'Tied at ' + yourTries + (yourTries === 1 ? ' try!' : ' tries!');
  }

  function shareText({ mode = 'daily', day = '', guesses = [], target = null, won = false, url = '', challengeUrl = '' } = {}) {
    const rows = (guesses || []).map((g) => {
      const tiles = compare(g, target);
      return tiles.map((t) => (t.status === 'exact' ? '🟩' : t.status === 'close' ? '🟨' : '⬛')).join('');
    });
    const header = mode === 'daily' && day
      ? `TuneUp · Daily Artist · ${day} · ${won ? guesses.length + '/10' : 'X/10'}`
      : `TuneUp · Artist Detective · ${won ? guesses.length + '/10' : 'X/10'}`;
    const targetUrl = String(challengeUrl || '').trim() || String(url || '').split('#')[0];
    return [header, ...rows, targetUrl].filter(Boolean).join('\n');
  }

  const api = {
    MAX_TRIES: 10,
    buildRoster,
    compare,
    dailyArtist,
    createChallenge,
    parseChallenge,
    compareChallenge,
    shareText
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArtistDetective = api;
})(typeof window === 'object' ? window : globalThis);

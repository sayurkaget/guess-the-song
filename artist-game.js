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
    MX: 'Mexico',
    AR: 'Argentina',
    NZ: 'New Zealand',
    NO: 'Norway',
    DK: 'Denmark',
    JM: 'Jamaica',
    NL: 'Netherlands',
    DE: 'Germany',
    BE: 'Belgium',
    ES: 'Spain',
    IT: 'Italy',
    FI: 'Finland',
    KR: 'South Korea',
    JP: 'Japan',
    IN: 'India',
    TH: 'Thailand',
    ID: 'Indonesia',
    PH: 'Philippines',
    IS: 'Iceland',
    TT: 'Trinidad',
    ZA: 'South Africa',
    NG: 'Nigeria'
  };

  /**
   * 530 iconic global artists present in songs.js.
   * Columns: [name, debutYear, type ('Solo'|'Duo'|'Group'), membersCount, gender ('Male'|'Female'|'Mixed'), genre, countryCode, continent, rank]
   */
  const RAW_ROSTER = [
    ['The Weeknd', 2011, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 1],
    ['Drake', 2009, 'Solo', 1, 'Male', 'Hip-hop', 'CA', 'North America', 2],
    ['Taylor Swift', 2006, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 3],
    ['Bad Bunny', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 4],
    ['Justin Bieber', 2009, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 5],
    ['Ariana Grande', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 6],
    ['Kanye West', 2004, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 7],
    ['Travis Scott', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 8],
    ['Eminem', 1999, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 9],
    ['Ed Sheeran', 2011, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 10],
    ['Rihanna', 2005, 'Solo', 1, 'Female', 'Pop', 'BB', 'North America', 11],
    ['Bruno Mars', 2010, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 12],
    ['Billie Eilish', 2016, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 13],
    ['Kendrick Lamar', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 14],
    ['BTS', 2013, 'Group', 7, 'Male', 'Pop', 'KR', 'Asia', 15],
    ['Post Malone', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 16],
    ['J Balvin', 2010, 'Solo', 1, 'Male', 'Pop', 'CO', 'Latin America', 17],
    ['Future', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 18],
    ['Ozuna', 2016, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 19],
    ['Coldplay', 2000, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 20],
    ['Juice WRLD', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 21],
    ['Chris Brown', 2005, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 22],
    ['David Guetta', 2002, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 23],
    ['Lana Del Rey', 2011, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 24],
    ['Nicki Minaj', 2010, 'Solo', 1, 'Female', 'Hip-hop', 'TT', 'North America', 25],
    ['Dua Lipa', 2015, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 26],
    ['Anuel AA', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 27],
    ['Daddy Yankee', 2004, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 28],
    ['Rauw Alejandro', 2016, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 29],
    ['Lil Wayne', 1999, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 30],
    ['Imagine Dragons', 2012, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 31],
    ['XXXTENTACION', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 32],
    ['SZA', 2014, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 33],
    ['Karol G', 2014, 'Solo', 1, 'Female', 'Pop', 'CO', 'Latin America', 34],
    ['Arijit Singh', 2011, 'Solo', 1, 'Male', 'Pop', 'IN', 'Asia', 35],
    ['21 Savage', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 36],
    ['Lady Gaga', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 37],
    ['Maroon 5', 2002, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 38],
    ['Lil Baby', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 39],
    ['Khalid', 2016, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 40],
    ['Beyoncé', 2003, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 41],
    ['Maluma', 2012, 'Solo', 1, 'Male', 'Pop', 'CO', 'Latin America', 42],
    ['Feid', 2015, 'Solo', 1, 'Male', 'Pop', 'CO', 'Latin America', 43],
    ['Calvin Harris', 2007, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 44],
    ['Linkin Park', 2000, 'Group', 6, 'Mixed', 'Rock', 'US', 'North America', 45],
    ['Myke Towers', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'PR', 'Latin America', 46],
    ['Peso Pluma', 2020, 'Solo', 1, 'Male', 'Pop', 'MX', 'Latin America', 47],
    ['Shakira', 1995, 'Solo', 1, 'Female', 'Pop', 'CO', 'Latin America', 48],
    ['J. Cole', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 49],
    ['Morgan Wallen', 2016, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 50],
    ['Lil Uzi Vert', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 51],
    ['Sia', 2000, 'Solo', 1, 'Female', 'Pop', 'AU', 'Oceania', 52],
    ['Olivia Rodrigo', 2021, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 53],
    ['Doja Cat', 2018, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 54],
    ['Young Thug', 2013, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 55],
    ['Pritam', 2001, 'Solo', 1, 'Male', 'Pop', 'IN', 'Asia', 56],
    ['Harry Styles', 2017, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 57],
    ['Farruko', 2010, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 58],
    ['Shawn Mendes', 2014, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 59],
    ['Fuerza Regida', 2018, 'Group', 5, 'Male', 'Pop', 'MX', 'Latin America', 60],
    ['Queen', 1973, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 61],
    ['Katy Perry', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 62],
    ['Sam Smith', 2013, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 63],
    ['One Direction', 2011, 'Group', 5, 'Male', 'Pop', 'UK', 'Europe', 64],
    ['Metro Boomin', 2013, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 65],
    ['Adele', 2008, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 66],
    ['Arctic Monkeys', 2006, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 67],
    ['Gunna', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 68],
    ['Michael Jackson', 1972, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 69],
    ['Tyler, The Creator', 2009, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 70],
    ['Selena Gomez', 2009, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 71],
    ['Pitbull', 2004, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 72],
    ['The Beatles', 1962, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 73],
    ['Playboi Carti', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 74],
    ['Sabrina Carpenter', 2015, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 75],
    ['Halsey', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 76],
    ['Wiz Khalifa', 2008, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 77],
    ['Frank Ocean', 2011, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 78],
    ['JAY-Z', 1996, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 79],
    ['A$AP Rocky', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 80],
    ['Miley Cyrus', 2007, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 81],
    ['The Chainsmokers', 2012, 'Duo', 2, 'Male', 'Electronic', 'US', 'North America', 82],
    ['Marshmello', 2015, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 83],
    ['Twenty One Pilots', 2009, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 84],
    ['Cardi B', 2017, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 85],
    ['Red Hot Chili Peppers', 1984, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 86],
    ['Camila Cabello', 2017, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 87],
    ['$uicideboy$', 2014, 'Duo', 2, 'Male', 'Hip-hop', 'US', 'North America', 88],
    ['OneRepublic', 2007, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 89],
    ['Don Toliver', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 90],
    ['50 Cent', 2003, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 91],
    ['Avicii', 2011, 'Solo', 1, 'Male', 'Electronic', 'SE', 'Europe', 92],
    ['Snoop Dogg', 1993, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 93],
    ['Diplo', 2004, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 94],
    ['Mac Miller', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 95],
    ['Zach Bryan', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 96],
    ['The Neighbourhood', 2012, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 97],
    ['DaBaby', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 98],
    ['Tate McRae', 2019, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 99],
    ['Luke Combs', 2016, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 100],
    ['Kygo', 2014, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 101],
    ['Elton John', 1969, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 102],
    ['Akon', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 103],
    ['Metallica', 1983, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 104],
    ['Kali Uchis', 2015, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 105],
    ['Lil Peep', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 106],
    ['Trippie Redd', 2017, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 107],
    ['Usher', 1994, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 108],
    ['Sean Paul', 2000, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 109],
    ['Justin Timberlake', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 110],
    ['Charlie Puth', 2015, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 111],
    ['Tiësto', 2001, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 112],
    ['Kodak Black', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 113],
    ['Jason Derulo', 2009, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 114],
    ['Daft Punk', 1997, 'Duo', 2, 'Male', 'Electronic', 'FR', 'Europe', 115],
    ['BLACKPINK', 2016, 'Group', 4, 'Female', 'Pop', 'KR', 'Asia', 116],
    ['Bebe Rexha', 2015, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 117],
    ['Demi Lovato', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 118],
    ['AC/DC', 1975, 'Group', 5, 'Male', 'Rock', 'AU', 'Oceania', 119],
    ['Radiohead', 1992, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 120],
    ['Fleetwood Mac', 1968, 'Group', 5, 'Mixed', 'Rock', 'UK', 'Europe', 121],
    ['Ellie Goulding', 2010, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 122],
    ['Black Eyed Peas', 1998, 'Group', 4, 'Mixed', 'Pop', 'US', 'North America', 123],
    ['A Boogie Wit da Hoodie', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 124],
    ['Shreya Ghoshal', 2002, 'Solo', 1, 'Female', 'Pop', 'IN', 'Asia', 125],
    ['Hozier', 2013, 'Solo', 1, 'Male', 'Indie', 'IE', 'Europe', 126],
    ['Daniel Caesar', 2014, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 127],
    ['Alan Walker', 2015, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 128],
    ['Flo Rida', 2007, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 129],
    ['Britney Spears', 1998, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 130],
    ['A.R. Rahman', 1992, 'Solo', 1, 'Male', 'Pop', 'IN', 'Asia', 131],
    ['Nirvana', 1989, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 132],
    ['P!nk', 2000, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 133],
    ['Tory Lanez', 2015, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 134],
    ['Big Sean', 2011, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 135],
    ['James Arthur', 2012, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 136],
    ['Pop Smoke', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 137],
    ['DJ Snake', 2013, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 138],
    ['Pharrell Williams', 2003, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 139],
    ['Swae Lee', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 140],
    ['Green Day', 1990, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 141],
    ['The Kid LAROI', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'AU', 'Oceania', 142],
    ['Bizarrap', 2019, 'Solo', 1, 'Male', 'Electronic', 'AR', 'Latin America', 143],
    ['Stray Kids', 2018, 'Group', 8, 'Male', 'Pop', 'KR', 'Asia', 144],
    ['Tame Impala', 2010, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 145],
    ['Migos', 2013, 'Group', 3, 'Male', 'Hip-hop', 'US', 'North America', 146],
    ['Ne-Yo', 2006, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 147],
    ['Kid Cudi', 2008, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 148],
    ['Polo G', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 149],
    ['PARTYNEXTDOOR', 2013, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 150],
    ['Charli XCX', 2012, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 151],
    ['Noah Kahan', 2017, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 152],
    ['Zara Larsson', 2013, 'Solo', 1, 'Female', 'Pop', 'SE', 'Europe', 153],
    ['Joji', 2017, 'Solo', 1, 'Male', 'R&B', 'JP', 'Asia', 154],
    ['ROSALÍA', 2017, 'Solo', 1, 'Female', 'Pop', 'ES', 'Europe', 155],
    ['Bob Marley', 1965, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 156],
    ['Gorillaz', 2001, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 157],
    ['Fall Out Boy', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 158],
    ['Panic! At The Disco', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 159],
    ['2Pac', 1991, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 160],
    ['Bryson Tiller', 2015, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 161],
    ['Lewis Capaldi', 2017, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 162],
    ["Guns N' Roses", 1987, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 163],
    ['Cigarettes After Sex', 2012, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 164],
    ['Brent Faiyaz', 2016, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 165],
    ['Mariah Carey', 1990, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 166],
    ['NF', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 167],
    ['Megan Thee Stallion', 2017, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 168],
    ['Roddy Ricch', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 169],
    ['Pink Floyd', 1967, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 170],
    ['Miguel', 2010, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 171],
    ['Dr. Dre', 1992, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 172],
    ['ABBA', 1972, 'Group', 4, 'Mixed', 'Pop', 'SE', 'Europe', 173],
    ['Martin Garrix', 2013, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 174],
    ['System Of A Down', 1998, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 175],
    ['Childish Gambino', 2011, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 176],
    ['Major Lazer', 2009, 'Group', 3, 'Male', 'Electronic', 'US', 'North America', 177],
    ['Enrique Iglesias', 1995, 'Solo', 1, 'Male', 'Pop', 'ES', 'Europe', 178],
    ['Lil Nas X', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 179],
    ['5 Seconds of Summer', 2012, 'Group', 4, 'Male', 'Pop', 'AU', 'Oceania', 180],
    ['TWICE', 2015, 'Group', 9, 'Female', 'Pop', 'KR', 'Asia', 181],
    ['Jack Harlow', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 182],
    ['The Rolling Stones', 1963, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 183],
    ['Zayn', 2016, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 184],
    ['Ava Max', 2018, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 185],
    ['Macklemore', 2005, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 186],
    ['Frank Sinatra', 1940, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 187],
    ['Michael Bublé', 2003, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 188],
    ['Anne-Marie', 2015, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 189],
    ['Logic', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 190],
    ['Madonna', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 191],
    ['Alicia Keys', 2001, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 192],
    ['Kesha', 2009, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 193],
    ['Robin Schulz', 2014, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 194],
    ['Chris Stapleton', 2015, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 195],
    ['Lauv', 2015, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 196],
    ['Paramore', 2005, 'Group', 3, 'Mixed', 'Rock', 'US', 'North America', 197],
    ['Lil Tecca', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 198],
    ['Lorde', 2013, 'Solo', 1, 'Female', 'Indie', 'NZ', 'Oceania', 199],
    ['Melanie Martinez', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 200],
    ['Meghan Trainor', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 201],
    ['Oasis', 1994, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 202],
    ['Troye Sivan', 2014, 'Solo', 1, 'Male', 'Pop', 'AU', 'Oceania', 203],
    ['John Legend', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 204],
    ['Zedd', 2012, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 205],
    ['Creedence Clearwater Revival', 1968, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 206],
    ['French Montana', 2009, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 207],
    ['Elvis Presley', 1954, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 208],
    ['Jung Kook', 2023, 'Solo', 1, 'Male', 'Pop', 'KR', 'Asia', 209],
    ['T-Pain', 2005, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 210],
    ['Slipknot', 1999, 'Group', 9, 'Male', 'Rock', 'US', 'North America', 211],
    ['Christina Aguilera', 1999, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 212],
    ['DJ Khaled', 2006, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 213],
    ['Steve Lacy', 2017, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 214],
    ['Mitski', 2012, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 215],
    ['The Notorious B.I.G.', 1994, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 216],
    ['Rammstein', 1995, 'Group', 6, 'Male', 'Rock', 'DE', 'Europe', 217],
    ['Bon Jovi', 1984, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 218],
    ['Skrillex', 2010, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 219],
    ['The Killers', 2004, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 220],
    ['Burna Boy', 2012, 'Solo', 1, 'Male', 'R&B', 'NG', 'Africa', 221],
    ['Jhene Aiko', 2011, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 222],
    ['blink-182', 1995, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 223],
    ['Little Mix', 2011, 'Group', 4, 'Female', 'Pop', 'UK', 'Europe', 224],
    ['Summer Walker', 2018, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 225],
    ['David Bowie', 1969, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 226],
    ['Clean Bandit', 2012, 'Group', 3, 'Mixed', 'Electronic', 'UK', 'Europe', 227],
    ['U2', 1980, 'Group', 4, 'Male', 'Rock', 'IE', 'Europe', 228],
    ['Foo Fighters', 1995, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 229],
    ['Labrinth', 2010, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 230],
    ['Gracie Abrams', 2019, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 231],
    ['The 1975', 2013, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 232],
    ['My Chemical Romance', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 233],
    ['Ludacris', 2000, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 234],
    ['Conan Gray', 2017, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 235],
    ['Kehlani', 2014, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 236],
    ['Benson Boone', 2021, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 237],
    ['Nickelback', 1996, 'Group', 4, 'Male', 'Rock', 'CA', 'North America', 238],
    ['Central Cee', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 239],
    ['Bring Me The Horizon', 2006, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 240],
    ['Mac DeMarco', 2012, 'Solo', 1, 'Male', 'Indie', 'CA', 'North America', 241],
    ['RAYE', 2014, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 242],
    ['Måneskin', 2017, 'Group', 4, 'Mixed', 'Rock', 'IT', 'Europe', 243],
    ['Led Zeppelin', 1969, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 244],
    ['Luis Fonsi', 1998, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 245],
    ['Teddy Swims', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 246],
    ['Tove Lo', 2013, 'Solo', 1, 'Female', 'Pop', 'SE', 'Europe', 247],
    ['The Lumineers', 2012, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 248],
    ['Olivia Dean', 2018, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 249],
    ['Florence + The Machine', 2009, 'Group', 7, 'Mixed', 'Indie', 'UK', 'Europe', 250],
    ['Billy Joel', 1971, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 251],
    ['Giveon', 2018, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 252],
    ['Deftones', 1995, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 253],
    ['Muse', 1999, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 254],
    ['Bastille', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 255],
    ['TV Girl', 2010, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 256],
    ['Luke Bryan', 2007, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 257],
    ['Dave', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 258],
    ['Bruce Springsteen', 1973, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 259],
    ['Clairo', 2017, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 260],
    ['Kings of Leon', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 261],
    ['Whitney Houston', 1985, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 262],
    ['Jonas Brothers', 2006, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 263],
    ['Amy Winehouse', 2003, 'Solo', 1, 'Female', 'R&B', 'UK', 'Europe', 264],
    ['Avril Lavigne', 2002, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 265],
    ['Chappell Roan', 2020, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 266],
    ['Backstreet Boys', 1995, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 267],
    ['JENNIE', 2018, 'Solo', 1, 'Female', 'Pop', 'KR', 'Asia', 268],
    ['Lost Frequencies', 2014, 'Solo', 1, 'Male', 'Electronic', 'BE', 'Europe', 269],
    ['The Script', 2008, 'Group', 3, 'Male', 'Pop', 'IE', 'Europe', 270],
    ['Glass Animals', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 271],
    ['Jack Johnson', 2001, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 272],
    ['Jimin', 2023, 'Solo', 1, 'Male', 'Pop', 'KR', 'Asia', 273],
    ['The Offspring', 1989, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 274],
    ['Stevie Wonder', 1962, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 275],
    ['Mark Ronson', 2003, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 276],
    ['Kelly Clarkson', 2002, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 277],
    ['Bee Gees', 1967, 'Group', 3, 'Male', 'Pop', 'UK', 'Europe', 278],
    ['Aerosmith', 1973, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 279],
    ['The Smiths', 1983, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 280],
    ['SEVENTEEN', 2015, 'Group', 13, 'Male', 'Pop', 'KR', 'Asia', 281],
    ['Niall Horan', 2016, 'Solo', 1, 'Male', 'Pop', 'IE', 'Europe', 282],
    ['The Strokes', 2001, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 283],
    ['The Police', 1978, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 284],
    ['Vance Joy', 2013, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 285],
    ['Eagles', 1972, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 286],
    ['Dominic Fike', 2018, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 287],
    ['Dire Straits', 1978, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 288],
    ['Phil Collins', 1981, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 289],
    ['Bon Iver', 2007, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 290],
    ['Avenged Sevenfold', 2001, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 291],
    ['NewJeans', 2022, 'Group', 5, 'Female', 'Pop', 'KR', 'Asia', 292],
    ['Jess Glynne', 2014, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 293],
    ['Rae Sremmurd', 2014, 'Duo', 2, 'Male', 'Hip-hop', 'US', 'North America', 294],
    ['Rex Orange County', 2015, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 295],
    ['beabadoobee', 2017, 'Solo', 1, 'Female', 'Indie', 'UK', 'Europe', 296],
    ['Nelly Furtado', 2000, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 297],
    ['ENHYPEN', 2020, 'Group', 7, 'Male', 'Pop', 'KR', 'Asia', 298],
    ['Nelly', 2000, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 299],
    ['Pearl Jam', 1991, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 300],
    ['Mumford & Sons', 2009, 'Group', 3, 'Male', 'Indie', 'UK', 'Europe', 301],
    ['Disclosure', 2012, 'Duo', 2, 'Male', 'Electronic', 'UK', 'Europe', 302],
    ['LANY', 2014, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 303],
    ['Celine Dion', 1981, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 304],
    ['Alesso', 2011, 'Solo', 1, 'Male', 'Electronic', 'SE', 'Europe', 305],
    ['Disturbed', 2000, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 306],
    ['Laufey', 2020, 'Solo', 1, 'Female', 'Indie', 'IS', 'Europe', 307],
    ['Bryan Adams', 1980, 'Solo', 1, 'Male', 'Rock', 'CA', 'North America', 308],
    ['The Marías', 2017, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 309],
    ['Alex Warren', 2021, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 310],
    ['B.o.B', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 311],
    ['Tom Odell', 2012, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 312],
    ['Rita Ora', 2012, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 313],
    ['Johnny Cash', 1955, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 314],
    ['Limp Bizkit', 1997, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 315],
    ['Empire of the Sun', 2008, 'Duo', 2, 'Male', 'Electronic', 'AU', 'Oceania', 316],
    ['Phoebe Bridgers', 2017, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 317],
    ['The Cure', 1979, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 318],
    ['Korn', 1994, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 319],
    ['Calum Scott', 2016, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 320],
    ['Jason Mraz', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 321],
    ['OutKast', 1994, 'Duo', 2, 'Male', 'Hip-hop', 'US', 'North America', 322],
    ['PinkPantheress', 2021, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 323],
    ['NIKI', 2017, 'Solo', 1, 'Female', 'Indie', 'ID', 'Asia', 324],
    ['Alec Benjamin', 2018, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 325],
    ['sombr', 2021, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 326],
    ['MGMT', 2007, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 327],
    ['Dean Lewis', 2016, 'Solo', 1, 'Male', 'Pop', 'AU', 'Oceania', 328],
    ['LE SSERAFIM', 2022, 'Group', 5, 'Female', 'Pop', 'KR', 'Asia', 329],
    ['Train', 1998, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 330],
    ['Swedish House Mafia', 2010, 'Group', 3, 'Male', 'Electronic', 'SE', 'Europe', 331],
    ['Rema', 2019, 'Solo', 1, 'Male', 'Pop', 'NG', 'Africa', 332],
    ['The Cranberries', 1993, 'Group', 4, 'Mixed', 'Rock', 'IE', 'Europe', 333],
    ['Lord Huron', 2010, 'Group', 4, 'Male', 'Indie', 'US', 'North America', 334],
    ['Gwen Stefani', 2004, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 335],
    ['Journey', 1975, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 336],
    ['Marvin Gaye', 1961, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 337],
    ['George Ezra', 2013, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 338],
    ['Weezer', 1994, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 339],
    ['Lizzo', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 340],
    ['Fifth Harmony', 2013, 'Group', 5, 'Female', 'Pop', 'US', 'North America', 341],
    ['d4vd', 2022, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 342],
    ['Cage The Elephant', 2008, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 343],
    ['Depeche Mode', 1981, 'Group', 3, 'Male', 'Electronic', 'UK', 'Europe', 344],
    ['Armin van Buuren', 1999, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 345],
    ['Madison Beer', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 346],
    ['Bob Dylan', 1962, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 347],
    ['Daryl Hall & John Oates', 1972, 'Duo', 2, 'Male', 'Pop', 'US', 'North America', 348],
    ['Evanescence', 2003, 'Group', 5, 'Mixed', 'Rock', 'US', 'North America', 349],
    ['Jessie J', 2011, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 350],
    ['Earth, Wind & Fire', 1971, 'Group', 7, 'Male', 'R&B', 'US', 'North America', 351],
    ['Toto', 1978, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 352],
    ['aespa', 2020, 'Group', 4, 'Female', 'Pop', 'KR', 'Asia', 353],
    ['Flume', 2012, 'Solo', 1, 'Male', 'Electronic', 'AU', 'Oceania', 354],
    ['V', 2023, 'Solo', 1, 'Male', 'Pop', 'KR', 'Asia', 355],
    ['Shaggy', 1993, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 356],
    ['ROSÉ', 2021, 'Solo', 1, 'Female', 'Pop', 'NZ', 'Oceania', 357],
    ['Fred again..', 2019, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 358],
    ['X Ambassadors', 2013, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 359],
    ['Galantis', 2013, 'Duo', 2, 'Male', 'Electronic', 'SE', 'Europe', 360],
    ['Iron Maiden', 1980, 'Group', 6, 'Male', 'Rock', 'UK', 'Europe', 361],
    ['Foster the People', 2010, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 362],
    ['Tones and I', 2019, 'Solo', 1, 'Female', 'Pop', 'AU', 'Oceania', 363],
    ['Nas', 1994, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 364],
    ['James Bay', 2013, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 365],
    ['LISA', 2021, 'Solo', 1, 'Female', 'Pop', 'TH', 'Asia', 366],
    ['Goo Goo Dolls', 1987, 'Duo', 2, 'Male', 'Rock', 'US', 'North America', 367],
    ['Lukas Graham', 2012, 'Group', 3, 'Male', 'Pop', 'DK', 'Europe', 368],
    ['Cyndi Lauper', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 369],
    ['Kacey Musgraves', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 370],
    ['JVKE', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 371],
    ['George Michael', 1984, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 372],
    ['girl in red', 2018, 'Solo', 1, 'Female', 'Indie', 'NO', 'Europe', 373],
    ['Carly Rae Jepsen', 2008, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 374],
    ['Papa Roach', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 375],
    ['Lynyrd Skynyrd', 1973, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 376],
    ['James Blunt', 2004, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 377],
    ['Illenium', 2014, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 378],
    ['Passenger', 2012, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 379],
    ["Destiny's Child", 1998, 'Group', 3, 'Female', 'R&B', 'US', 'North America', 380],
    ['Keane', 2004, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 381],
    ['Dolly Parton', 1967, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 382],
    ['The Beach Boys', 1962, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 383],
    ['Ozzy Osbourne', 1980, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 384],
    ['Norah Jones', 2002, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 385],
    ['Tears for Fears', 1982, 'Duo', 2, 'Male', 'Pop', 'UK', 'Europe', 386],
    ['Lauryn Hill', 1998, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 387],
    ['keshi', 2017, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 388],
    ['Stormzy', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 389],
    ['Tyla', 2019, 'Solo', 1, 'Female', 'R&B', 'ZA', 'Africa', 390],
    ['Mike Posner', 2010, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 391],
    ['Van Halen', 1978, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 392],
    ['Eric Clapton', 1970, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 393],
    ['Ruth B.', 2015, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 394],
    ['The Fray', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 395],
    ['Simon & Garfunkel', 1964, 'Duo', 2, 'Male', 'Rock', 'US', 'North America', 396],
    ['Prince', 1978, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 397],
    ['alt-J', 2012, 'Group', 3, 'Male', 'Indie', 'UK', 'Europe', 398],
    ['Doechii', 2020, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 399],
    ['3 Doors Down', 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 400],
    ['CeeLo Green', 2002, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 401],
    ['RÜFÜS DU SOL', 2011, 'Group', 3, 'Male', 'Electronic', 'AU', 'Oceania', 402],
    ['Sum 41', 2000, 'Group', 5, 'Male', 'Rock', 'CA', 'North America', 403],
    ['Electric Light Orchestra', 1971, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 404],
    ['a-ha', 1984, 'Group', 3, 'Male', 'Pop', 'NO', 'Europe', 405],
    ['Sufjan Stevens', 2000, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 406],
    ['Beach House', 2006, 'Duo', 2, 'Mixed', 'Indie', 'US', 'North America', 407],
    ['Wham!', 1982, 'Duo', 2, 'Male', 'Pop', 'UK', 'Europe', 408],
    ['The White Stripes', 1999, 'Duo', 2, 'Mixed', 'Rock', 'US', 'North America', 409],
    ['Stephen Sanchez', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 410],
    ['Djo', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 411],
    ['M83', 2001, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 412],
    ['All Time Low', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 413],
    ['Jimi Hendrix', 1967, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 414],
    ['Aretha Franklin', 1960, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 415],
    ['Silk Sonic', 2021, 'Duo', 2, 'Male', 'R&B', 'US', 'North America', 416],
    ['Ice Spice', 2022, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 417],
    ['John Lennon', 1970, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 418],
    ['Kodaline', 2012, 'Group', 4, 'Male', 'Indie', 'IE', 'Europe', 419],
    ['NSYNC', 1997, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 420],
    ['Alex G', 2010, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 421],
    ['Shaboozey', 2018, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 422],
    ['Westlife', 1999, 'Group', 4, 'Male', 'Pop', 'IE', 'Europe', 423],
    ['Creed', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 424],
    ['Louis Armstrong', 1925, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 425],
    ['Foreigner', 1977, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 426],
    ['Of Monsters and Men', 2011, 'Group', 5, 'Mixed', 'Indie', 'IS', 'Europe', 427],
    ['Taio Cruz', 2008, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 428],
    ['ODESZA', 2012, 'Duo', 2, 'Male', 'Electronic', 'US', 'North America', 429],
    ['Blur', 1991, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 430],
    ['IVE', 2021, 'Group', 6, 'Female', 'Pop', 'KR', 'Asia', 431],
    ['Artemas', 2020, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 432],
    ['Two Door Cinema Club', 2010, 'Group', 3, 'Male', 'Indie', 'IE', 'Europe', 433],
    ['TLC', 1992, 'Group', 3, 'Female', 'R&B', 'US', 'North America', 434],
    ['Thirty Seconds to Mars', 2002, 'Duo', 2, 'Male', 'Rock', 'US', 'North America', 435],
    ['Wallows', 2017, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 436],
    ['Colbie Caillat', 2007, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 437],
    ['Audioslave', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 438],
    ['Snow Patrol', 1998, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 439],
    ['The Jackson 5', 1969, 'Group', 5, 'Male', 'R&B', 'US', 'North America', 440],
    ['ILLIT', 2024, 'Group', 5, 'Female', 'Pop', 'KR', 'Asia', 441],
    ['TOOL', 1992, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 442],
    ['Billy Idol', 1982, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 443],
    ['Pixies', 1987, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 444],
    ['Simple Plan', 2002, 'Group', 4, 'Male', 'Rock', 'CA', 'North America', 445],
    ['Rich Brian', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'ID', 'Asia', 446],
    ['MAGIC!', 2013, 'Group', 4, 'Male', 'Pop', 'CA', 'North America', 447],
    ['Gotye', 2006, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 448],
    ['Powfu', 2019, 'Solo', 1, 'Male', 'Indie', 'CA', 'North America', 449],
    ['Gigi Perez', 2021, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 450],
    ['Kenny Rogers', 1976, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 451],
    ['Tom Petty', 1976, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 452],
    ['Jaymes Young', 2013, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 453],
    ['The Who', 1965, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 454],
    ['John Denver', 1969, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 455],
    ['Cuco', 2016, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 456],
    ['Talking Heads', 1977, 'Group', 4, 'Mixed', 'Rock', 'US', 'North America', 457],
    ['Def Leppard', 1980, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 458],
    ['Myles Smith', 2020, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 459],
    ['Chicago', 1969, 'Group', 7, 'Male', 'Rock', 'US', 'North America', 460],
    ['Lola Young', 2019, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 461],
    ['Spice Girls', 1996, 'Group', 5, 'Female', 'Pop', 'UK', 'Europe', 462],
    ['Counting Crows', 1993, 'Group', 7, 'Male', 'Rock', 'US', 'North America', 463],
    ['OMI', 2012, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 464],
    ['Eurythmics', 1981, 'Duo', 2, 'Mixed', 'Pop', 'UK', 'Europe', 465],
    ['No Doubt', 1992, 'Group', 4, 'Mixed', 'Rock', 'US', 'North America', 466],
    ['The Walters', 2014, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 467],
    ['Soundgarden', 1988, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 468],
    ['Stone Temple Pilots', 1992, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 469],
    ['The All-American Rejects', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 470],
    ['Bonnie Tyler', 1977, 'Solo', 1, 'Female', 'Rock', 'UK', 'Europe', 471],
    ['Survivor', 1980, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 472],
    ['Matchbox Twenty', 1996, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 473],
    ['The Temptations', 1964, 'Group', 5, 'Male', 'R&B', 'US', 'North America', 474],
    ['The Verve', 1993, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 475],
    ['Omar Apollo', 2018, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 476],
    ['deadmau5', 2005, 'Solo', 1, 'Male', 'Electronic', 'CA', 'North America', 477],
    ['Franz Ferdinand', 2004, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 478],
    ['Capital Cities', 2011, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 479],
    ['Jeff Buckley', 1994, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 480],
    ['Men I Trust', 2014, 'Group', 3, 'Mixed', 'Indie', 'CA', 'North America', 481],
    ['Ben E. King', 1961, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 482],
    ['The Temper Trap', 2009, 'Group', 4, 'Male', 'Indie', 'AU', 'Oceania', 483],
    ['Hoobastank', 2001, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 484],
    ['The Mamas & The Papas', 1966, 'Group', 4, 'Mixed', 'Pop', 'US', 'North America', 485],
    ['New Order', 1981, 'Group', 4, 'Mixed', 'Electronic', 'UK', 'Europe', 486],
    ['Boston', 1976, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 487],
    ['American Authors', 2013, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 488],
    ['Kansas', 1974, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 489],
    ['Crowded House', 1986, 'Group', 3, 'Male', 'Rock', 'AU', 'Oceania', 490],
    ['Fugees', 1994, 'Group', 3, 'Mixed', 'Hip-hop', 'US', 'North America', 491],
    ['Cascada', 2005, 'Group', 3, 'Mixed', 'Electronic', 'DE', 'Europe', 492],
    ['Good Charlotte', 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 493],
    ['Grouplove', 2011, 'Group', 5, 'Mixed', 'Indie', 'US', 'North America', 494],
    ['Third Eye Blind', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 495],
    ["Plain White T's", 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 496],
    ['Lifehouse', 2000, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 497],
    ['Motorhead', 1977, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 498],
    ['Iron & Wine', 2002, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 499],
    ['Modest Mouse', 1996, 'Group', 4, 'Male', 'Indie', 'US', 'North America', 500],
    ['Take That', 1992, 'Group', 3, 'Male', 'Pop', 'UK', 'Europe', 501],
    ['Europe', 1983, 'Group', 5, 'Male', 'Rock', 'SE', 'Europe', 502],
    ['Big Thief', 2016, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 503],
    ['Haddaway', 1993, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 504],
    ['Rick Astley', 1987, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 505],
    ['Justice', 2007, 'Duo', 2, 'Male', 'Electronic', 'FR', 'Europe', 506],
    ['Frankie Valli', 1967, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 507],
    ['Corinne Bailey Rae', 2006, 'Solo', 1, 'Female', 'R&B', 'UK', 'Europe', 508],
    ['PSY', 2001, 'Solo', 1, 'Male', 'Pop', 'KR', 'Asia', 509],
    ['Travie McCoy', 2010, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 510],
    ['Joy Division', 1979, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 511],
    ['Yellowcard', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 512],
    ['Gloria Gaynor', 1975, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 513],
    ['Fatboy Slim', 1996, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 514],
    ['Passion Pit', 2009, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 515],
    ['Natalie Imbruglia', 1997, 'Solo', 1, 'Female', 'Pop', 'AU', 'Oceania', 516],
    ['Soft Cell', 1981, 'Duo', 2, 'Male', 'Electronic', 'UK', 'Europe', 517],
    ['Jet', 2003, 'Group', 4, 'Male', 'Rock', 'AU', 'Oceania', 518],
    ['The Righteous Brothers', 1963, 'Duo', 2, 'Male', 'R&B', 'US', 'North America', 519],
    ['Eiffel 65', 1999, 'Group', 3, 'Male', 'Electronic', 'IT', 'Europe', 520],
    ['The Human League', 1979, 'Group', 3, 'Mixed', 'Electronic', 'UK', 'Europe', 521],
    ['Darude', 1999, 'Solo', 1, 'Male', 'Electronic', 'FI', 'Europe', 522],
    ['Bobby Darin', 1958, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 523],
    ['Styx', 1972, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 524],
    ['CHIC', 1977, 'Group', 4, 'Mixed', 'R&B', 'US', 'North America', 525],
    ['Pulp', 1983, 'Group', 4, 'Mixed', 'Rock', 'UK', 'Europe', 526],
    ['Hanson', 1997, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 527],
    ['Edith Piaf', 1936, 'Solo', 1, 'Female', 'Pop', 'FR', 'Europe', 528],
    ['boy pablo', 2017, 'Solo', 1, 'Male', 'Indie', 'NO', 'Europe', 529],
    ['Village People', 1977, 'Group', 6, 'Male', 'Pop', 'US', 'North America', 530]
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

  function pickClueHint(guesses, target) {
    if (!target) return null;
    const solvedKeys = new Set();
    for (const g of (guesses || [])) {
      for (const t of compare(g, target)) {
        if (t.status === 'exact') solvedKeys.add(t.key);
      }
    }
    const order = [
      ['genre', 'Genre', String(target.genre)],
      ['country', 'Country', String(target.country)],
      ['debut', 'Debut', String(target.debut)],
      ['members', 'Type', target.type === 'Group' ? `Group (${target.members})` : String(target.type)],
      ['gender', 'Gender', String(target.gender)],
      ['rank', 'Global Rank', `#${target.rank}`]
    ];
    const picked = order.find(([k]) => !solvedKeys.has(k)) || order[order.length - 1];
    return { kind: 'clue', key: picked[0], label: picked[1], value: picked[2] };
  }

  function nameHint(target) {
    if (!target || !target.name) return null;
    const trimmed = String(target.name).trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    const first = words[0].charAt(0).toUpperCase();
    let detail;
    if (words.length === 1) {
      detail = /^[A-Za-z]+$/.test(words[0]) ? `${words[0].length} letters` : '1 word';
    } else {
      detail = `${words.length} words`;
    }
    return { kind: 'name', key: 'name', label: 'Name', value: `Starts with "${first}" · ${detail}` };
  }

  function shareText({ mode = 'daily', day = '', guesses = [], target = null, won = false, url = '', challengeUrl = '', hintsUsed = 0 } = {}) {
    const rows = (guesses || []).map((g) => {
      const tiles = compare(g, target);
      return tiles.map((t) => (t.status === 'exact' ? '🟩' : t.status === 'close' ? '🟨' : '⬛')).join('');
    });
    const hCount = Math.max(0, Number(hintsUsed) || 0);
    const suffix = hCount ? ` · ${hCount} ${hCount === 1 ? 'hint' : 'hints'}` : '';
    const header = mode === 'daily' && day
      ? `TuneUp · Daily Artist · ${day} · ${won ? guesses.length + '/10' : 'X/10'}${suffix}`
      : `TuneUp · Artist Detective · ${won ? guesses.length + '/10' : 'X/10'}${suffix}`;
    const targetUrl = String(challengeUrl || '').trim() || String(url || '').split('#')[0];
    return [header, ...rows, targetUrl].filter(Boolean).join('\n');
  }

  const api = {
    MAX_TRIES: 10,
    HINT1_AFTER: 5,
    HINT2_AFTER: 7,
    ROSTER_SIZE: RAW_ROSTER.length,
    buildRoster,
    compare,
    pickClueHint,
    nameHint,
    dailyArtist,
    createChallenge,
    parseChallenge,
    compareChallenge,
    shareText
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArtistDetective = api;
})(typeof window === 'object' ? window : globalThis);

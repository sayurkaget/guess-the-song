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
    NZ: 'New Zealand',
    NO: 'Norway',
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
    IS: 'Iceland',
    TT: 'Trinidad',
    ZA: 'South Africa',
    NG: 'Nigeria'
  };

  /**
   * 450 iconic global artists present in songs.js.
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
    ['OneRepublic', 2007, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 88],
    ['Don Toliver', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 89],
    ['50 Cent', 2003, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 90],
    ['Avicii', 2011, 'Solo', 1, 'Male', 'Electronic', 'SE', 'Europe', 91],
    ['Snoop Dogg', 1993, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 92],
    ['Diplo', 2004, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 93],
    ['Mac Miller', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 94],
    ['Zach Bryan', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 95],
    ['The Neighbourhood', 2012, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 96],
    ['DaBaby', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 97],
    ['Tate McRae', 2019, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 98],
    ['Luke Combs', 2016, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 99],
    ['Kygo', 2014, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 100],
    ['Elton John', 1969, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 101],
    ['Akon', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 102],
    ['Metallica', 1983, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 103],
    ['Kali Uchis', 2015, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 104],
    ['Lil Peep', 2015, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 105],
    ['Usher', 1994, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 106],
    ['Sean Paul', 2000, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 107],
    ['Justin Timberlake', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 108],
    ['Charlie Puth', 2015, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 109],
    ['Tiësto', 2001, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 110],
    ['Jason Derulo', 2009, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 111],
    ['Daft Punk', 1997, 'Duo', 2, 'Male', 'Electronic', 'FR', 'Europe', 112],
    ['BLACKPINK', 2016, 'Group', 4, 'Female', 'Pop', 'KR', 'Asia', 113],
    ['Bebe Rexha', 2015, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 114],
    ['Demi Lovato', 2008, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 115],
    ['AC/DC', 1975, 'Group', 5, 'Male', 'Rock', 'AU', 'Oceania', 116],
    ['Radiohead', 1992, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 117],
    ['Fleetwood Mac', 1968, 'Group', 5, 'Mixed', 'Rock', 'UK', 'Europe', 118],
    ['Ellie Goulding', 2010, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 119],
    ['Black Eyed Peas', 1998, 'Group', 4, 'Mixed', 'Pop', 'US', 'North America', 120],
    ['Shreya Ghoshal', 2002, 'Solo', 1, 'Female', 'Pop', 'IN', 'Asia', 121],
    ['Hozier', 2013, 'Solo', 1, 'Male', 'Indie', 'IE', 'Europe', 122],
    ['Daniel Caesar', 2014, 'Solo', 1, 'Male', 'R&B', 'CA', 'North America', 123],
    ['Alan Walker', 2015, 'Solo', 1, 'Male', 'Electronic', 'NO', 'Europe', 124],
    ['Flo Rida', 2007, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 125],
    ['Britney Spears', 1998, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 126],
    ['A.R. Rahman', 1992, 'Solo', 1, 'Male', 'Pop', 'IN', 'Asia', 127],
    ['Nirvana', 1989, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 128],
    ['P!nk', 2000, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 129],
    ['James Arthur', 2012, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 130],
    ['Pop Smoke', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 131],
    ['DJ Snake', 2013, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 132],
    ['Pharrell Williams', 2003, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 133],
    ['Swae Lee', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 134],
    ['Green Day', 1990, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 135],
    ['The Kid LAROI', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'AU', 'Oceania', 136],
    ['Stray Kids', 2018, 'Group', 8, 'Male', 'Pop', 'KR', 'Asia', 137],
    ['Tame Impala', 2010, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 138],
    ['Migos', 2013, 'Group', 3, 'Male', 'Hip-hop', 'US', 'North America', 139],
    ['Ne-Yo', 2006, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 140],
    ['Charli XCX', 2012, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 141],
    ['Noah Kahan', 2017, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 142],
    ['Zara Larsson', 2013, 'Solo', 1, 'Female', 'Pop', 'SE', 'Europe', 143],
    ['Joji', 2017, 'Solo', 1, 'Male', 'R&B', 'JP', 'Asia', 144],
    ['Bob Marley', 1965, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 145],
    ['Gorillaz', 2001, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 146],
    ['Fall Out Boy', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 147],
    ['Panic! At The Disco', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 148],
    ['2Pac', 1991, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 149],
    ['Bryson Tiller', 2015, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 150],
    ['Lewis Capaldi', 2017, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 151],
    ["Guns N' Roses", 1987, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 152],
    ['Cigarettes After Sex', 2012, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 153],
    ['Brent Faiyaz', 2016, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 154],
    ['Mariah Carey', 1990, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 155],
    ['Megan Thee Stallion', 2017, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 156],
    ['Roddy Ricch', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 157],
    ['Pink Floyd', 1967, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 158],
    ['Miguel', 2010, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 159],
    ['Dr. Dre', 1992, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 160],
    ['ABBA', 1972, 'Group', 4, 'Mixed', 'Pop', 'SE', 'Europe', 161],
    ['Martin Garrix', 2013, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 162],
    ['System Of A Down', 1998, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 163],
    ['Childish Gambino', 2011, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 164],
    ['Major Lazer', 2009, 'Group', 3, 'Male', 'Electronic', 'US', 'North America', 165],
    ['Enrique Iglesias', 1995, 'Solo', 1, 'Male', 'Pop', 'ES', 'Europe', 166],
    ['Lil Nas X', 2018, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 167],
    ['5 Seconds of Summer', 2012, 'Group', 4, 'Male', 'Pop', 'AU', 'Oceania', 168],
    ['TWICE', 2015, 'Group', 9, 'Female', 'Pop', 'KR', 'Asia', 169],
    ['The Rolling Stones', 1963, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 170],
    ['Zayn', 2016, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 171],
    ['Ava Max', 2018, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 172],
    ['Frank Sinatra', 1940, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 173],
    ['Michael Bublé', 2003, 'Solo', 1, 'Male', 'Pop', 'CA', 'North America', 174],
    ['Anne-Marie', 2015, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 175],
    ['Madonna', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 176],
    ['Alicia Keys', 2001, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 177],
    ['Kesha', 2009, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 178],
    ['Robin Schulz', 2014, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 179],
    ['Chris Stapleton', 2015, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 180],
    ['Paramore', 2005, 'Group', 3, 'Mixed', 'Rock', 'US', 'North America', 181],
    ['Lorde', 2013, 'Solo', 1, 'Female', 'Indie', 'NZ', 'Oceania', 182],
    ['Meghan Trainor', 2014, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 183],
    ['Oasis', 1994, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 184],
    ['Troye Sivan', 2014, 'Solo', 1, 'Male', 'Pop', 'AU', 'Oceania', 185],
    ['John Legend', 2004, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 186],
    ['Zedd', 2012, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 187],
    ['Creedence Clearwater Revival', 1968, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 188],
    ['Elvis Presley', 1954, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 189],
    ['T-Pain', 2005, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 190],
    ['Slipknot', 1999, 'Group', 9, 'Male', 'Rock', 'US', 'North America', 191],
    ['Christina Aguilera', 1999, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 192],
    ['Steve Lacy', 2017, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 193],
    ['Mitski', 2012, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 194],
    ['The Notorious B.I.G.', 1994, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 195],
    ['Bon Jovi', 1984, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 196],
    ['Skrillex', 2010, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 197],
    ['The Killers', 2004, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 198],
    ['Burna Boy', 2012, 'Solo', 1, 'Male', 'R&B', 'NG', 'Africa', 199],
    ['Jhene Aiko', 2011, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 200],
    ['blink-182', 1995, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 201],
    ['Little Mix', 2011, 'Group', 4, 'Female', 'Pop', 'UK', 'Europe', 202],
    ['Summer Walker', 2018, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 203],
    ['David Bowie', 1969, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 204],
    ['Clean Bandit', 2012, 'Group', 3, 'Mixed', 'Electronic', 'UK', 'Europe', 205],
    ['U2', 1980, 'Group', 4, 'Male', 'Rock', 'IE', 'Europe', 206],
    ['Foo Fighters', 1995, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 207],
    ['Gracie Abrams', 2019, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 208],
    ['The 1975', 2013, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 209],
    ['My Chemical Romance', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 210],
    ['Ludacris', 2000, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 211],
    ['Kehlani', 2014, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 212],
    ['Benson Boone', 2021, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 213],
    ['Nickelback', 1996, 'Group', 4, 'Male', 'Rock', 'CA', 'North America', 214],
    ['Central Cee', 2019, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 215],
    ['Bring Me The Horizon', 2006, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 216],
    ['Mac DeMarco', 2012, 'Solo', 1, 'Male', 'Indie', 'CA', 'North America', 217],
    ['RAYE', 2014, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 218],
    ['Led Zeppelin', 1969, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 219],
    ['Luis Fonsi', 1998, 'Solo', 1, 'Male', 'Pop', 'PR', 'Latin America', 220],
    ['Teddy Swims', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 221],
    ['Tove Lo', 2013, 'Solo', 1, 'Female', 'Pop', 'SE', 'Europe', 222],
    ['The Lumineers', 2012, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 223],
    ['Olivia Dean', 2018, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 224],
    ['Florence + The Machine', 2009, 'Group', 7, 'Mixed', 'Indie', 'UK', 'Europe', 225],
    ['Billy Joel', 1971, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 226],
    ['Giveon', 2018, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 227],
    ['Deftones', 1995, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 228],
    ['Muse', 1999, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 229],
    ['Bastille', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 230],
    ['Dave', 2016, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 231],
    ['Bruce Springsteen', 1973, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 232],
    ['Clairo', 2017, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 233],
    ['Kings of Leon', 2003, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 234],
    ['Whitney Houston', 1985, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 235],
    ['Jonas Brothers', 2006, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 236],
    ['Amy Winehouse', 2003, 'Solo', 1, 'Female', 'R&B', 'UK', 'Europe', 237],
    ['Avril Lavigne', 2002, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 238],
    ['Chappell Roan', 2020, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 239],
    ['Backstreet Boys', 1995, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 240],
    ['JENNIE', 2018, 'Solo', 1, 'Female', 'Pop', 'KR', 'Asia', 241],
    ['Lost Frequencies', 2014, 'Solo', 1, 'Male', 'Electronic', 'BE', 'Europe', 242],
    ['The Script', 2008, 'Group', 3, 'Male', 'Pop', 'IE', 'Europe', 243],
    ['Glass Animals', 2012, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 244],
    ['Jack Johnson', 2001, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 245],
    ['The Offspring', 1989, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 246],
    ['Stevie Wonder', 1962, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 247],
    ['Mark Ronson', 2003, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 248],
    ['Kelly Clarkson', 2002, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 249],
    ['Bee Gees', 1967, 'Group', 3, 'Male', 'Pop', 'UK', 'Europe', 250],
    ['Aerosmith', 1973, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 251],
    ['The Smiths', 1983, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 252],
    ['Niall Horan', 2016, 'Solo', 1, 'Male', 'Pop', 'IE', 'Europe', 253],
    ['The Strokes', 2001, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 254],
    ['The Police', 1978, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 255],
    ['Vance Joy', 2013, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 256],
    ['Eagles', 1972, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 257],
    ['Dominic Fike', 2018, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 258],
    ['Dire Straits', 1978, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 259],
    ['Bon Iver', 2007, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 260],
    ['NewJeans', 2022, 'Group', 5, 'Female', 'Pop', 'KR', 'Asia', 261],
    ['Jess Glynne', 2014, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 262],
    ['Rex Orange County', 2015, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 263],
    ['beabadoobee', 2017, 'Solo', 1, 'Female', 'Indie', 'UK', 'Europe', 264],
    ['Nelly Furtado', 2000, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 265],
    ['Nelly', 2000, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 266],
    ['Pearl Jam', 1991, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 267],
    ['Mumford & Sons', 2009, 'Group', 3, 'Male', 'Indie', 'UK', 'Europe', 268],
    ['Disclosure', 2012, 'Duo', 2, 'Male', 'Electronic', 'UK', 'Europe', 269],
    ['Celine Dion', 1981, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 270],
    ['Alesso', 2011, 'Solo', 1, 'Male', 'Electronic', 'SE', 'Europe', 271],
    ['Disturbed', 2000, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 272],
    ['Laufey', 2020, 'Solo', 1, 'Female', 'Indie', 'IS', 'Europe', 273],
    ['Bryan Adams', 1980, 'Solo', 1, 'Male', 'Rock', 'CA', 'North America', 274],
    ['The Marías', 2017, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 275],
    ['B.o.B', 2010, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 276],
    ['Rita Ora', 2012, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 277],
    ['Johnny Cash', 1955, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 278],
    ['Limp Bizkit', 1997, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 279],
    ['Empire of the Sun', 2008, 'Duo', 2, 'Male', 'Electronic', 'AU', 'Oceania', 280],
    ['Phoebe Bridgers', 2017, 'Solo', 1, 'Female', 'Indie', 'US', 'North America', 281],
    ['The Cure', 1979, 'Group', 5, 'Male', 'Indie', 'UK', 'Europe', 282],
    ['Korn', 1994, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 283],
    ['Jason Mraz', 2002, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 284],
    ['OutKast', 1994, 'Duo', 2, 'Male', 'Hip-hop', 'US', 'North America', 285],
    ['PinkPantheress', 2021, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 286],
    ['NIKI', 2017, 'Solo', 1, 'Female', 'Indie', 'ID', 'Asia', 287],
    ['sombr', 2021, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 288],
    ['MGMT', 2007, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 289],
    ['Train', 1998, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 290],
    ['Swedish House Mafia', 2010, 'Group', 3, 'Male', 'Electronic', 'SE', 'Europe', 291],
    ['Rema', 2019, 'Solo', 1, 'Male', 'Pop', 'NG', 'Africa', 292],
    ['The Cranberries', 1993, 'Group', 4, 'Mixed', 'Rock', 'IE', 'Europe', 293],
    ['Gwen Stefani', 2004, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 294],
    ['Journey', 1975, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 295],
    ['Marvin Gaye', 1961, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 296],
    ['George Ezra', 2013, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 297],
    ['Weezer', 1994, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 298],
    ['Lizzo', 2013, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 299],
    ['Fifth Harmony', 2013, 'Group', 5, 'Female', 'Pop', 'US', 'North America', 300],
    ['d4vd', 2022, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 301],
    ['Cage The Elephant', 2008, 'Group', 5, 'Male', 'Indie', 'US', 'North America', 302],
    ['Depeche Mode', 1981, 'Group', 3, 'Male', 'Electronic', 'UK', 'Europe', 303],
    ['Armin van Buuren', 1999, 'Solo', 1, 'Male', 'Electronic', 'NL', 'Europe', 304],
    ['Bob Dylan', 1962, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 305],
    ['Evanescence', 2003, 'Group', 5, 'Mixed', 'Rock', 'US', 'North America', 306],
    ['Jessie J', 2011, 'Solo', 1, 'Female', 'Pop', 'UK', 'Europe', 307],
    ['Earth, Wind & Fire', 1971, 'Group', 7, 'Male', 'R&B', 'US', 'North America', 308],
    ['Toto', 1978, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 309],
    ['Flume', 2012, 'Solo', 1, 'Male', 'Electronic', 'AU', 'Oceania', 310],
    ['Shaggy', 1993, 'Solo', 1, 'Male', 'Pop', 'JM', 'North America', 311],
    ['ROSÉ', 2021, 'Solo', 1, 'Female', 'Pop', 'NZ', 'Oceania', 312],
    ['Fred again..', 2019, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 313],
    ['X Ambassadors', 2013, 'Group', 3, 'Male', 'Rock', 'US', 'North America', 314],
    ['Galantis', 2013, 'Duo', 2, 'Male', 'Electronic', 'SE', 'Europe', 315],
    ['Iron Maiden', 1980, 'Group', 6, 'Male', 'Rock', 'UK', 'Europe', 316],
    ['Foster the People', 2010, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 317],
    ['Nas', 1994, 'Solo', 1, 'Male', 'Hip-hop', 'US', 'North America', 318],
    ['LISA', 2021, 'Solo', 1, 'Female', 'Pop', 'TH', 'Asia', 319],
    ['Goo Goo Dolls', 1987, 'Duo', 2, 'Male', 'Rock', 'US', 'North America', 320],
    ['Cyndi Lauper', 1983, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 321],
    ['JVKE', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 322],
    ['George Michael', 1984, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 323],
    ['girl in red', 2018, 'Solo', 1, 'Female', 'Indie', 'NO', 'Europe', 324],
    ['Papa Roach', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 325],
    ['Lynyrd Skynyrd', 1973, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 326],
    ['James Blunt', 2004, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 327],
    ['Illenium', 2014, 'Solo', 1, 'Male', 'Electronic', 'US', 'North America', 328],
    ['Passenger', 2012, 'Solo', 1, 'Male', 'Indie', 'UK', 'Europe', 329],
    ["Destiny's Child", 1998, 'Group', 3, 'Female', 'R&B', 'US', 'North America', 330],
    ['Keane', 2004, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 331],
    ['Dolly Parton', 1967, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 332],
    ['The Beach Boys', 1962, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 333],
    ['Ozzy Osbourne', 1980, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 334],
    ['Norah Jones', 2002, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 335],
    ['Lauryn Hill', 1998, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 336],
    ['keshi', 2017, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 337],
    ['Stormzy', 2014, 'Solo', 1, 'Male', 'Hip-hop', 'UK', 'Europe', 338],
    ['Tyla', 2019, 'Solo', 1, 'Female', 'R&B', 'ZA', 'Africa', 339],
    ['Van Halen', 1978, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 340],
    ['Eric Clapton', 1970, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 341],
    ['Ruth B.', 2015, 'Solo', 1, 'Female', 'Pop', 'CA', 'North America', 342],
    ['The Fray', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 343],
    ['Simon & Garfunkel', 1964, 'Duo', 2, 'Male', 'Rock', 'US', 'North America', 344],
    ['Prince', 1978, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 345],
    ['alt-J', 2012, 'Group', 3, 'Male', 'Indie', 'UK', 'Europe', 346],
    ['Doechii', 2020, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 347],
    ['3 Doors Down', 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 348],
    ['CeeLo Green', 2002, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 349],
    ['RÜFÜS DU SOL', 2011, 'Group', 3, 'Male', 'Electronic', 'AU', 'Oceania', 350],
    ['Sum 41', 2000, 'Group', 5, 'Male', 'Rock', 'CA', 'North America', 351],
    ['a-ha', 1984, 'Group', 3, 'Male', 'Pop', 'NO', 'Europe', 352],
    ['Sufjan Stevens', 2000, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 353],
    ['Beach House', 2006, 'Duo', 2, 'Mixed', 'Indie', 'US', 'North America', 354],
    ['Wham!', 1982, 'Duo', 2, 'Male', 'Pop', 'UK', 'Europe', 355],
    ['The White Stripes', 1999, 'Duo', 2, 'Mixed', 'Rock', 'US', 'North America', 356],
    ['Stephen Sanchez', 2020, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 357],
    ['Djo', 2019, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 358],
    ['M83', 2001, 'Solo', 1, 'Male', 'Electronic', 'FR', 'Europe', 359],
    ['All Time Low', 2005, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 360],
    ['Jimi Hendrix', 1967, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 361],
    ['Aretha Franklin', 1960, 'Solo', 1, 'Female', 'R&B', 'US', 'North America', 362],
    ['Silk Sonic', 2021, 'Duo', 2, 'Male', 'R&B', 'US', 'North America', 363],
    ['Ice Spice', 2022, 'Solo', 1, 'Female', 'Hip-hop', 'US', 'North America', 364],
    ['John Lennon', 1970, 'Solo', 1, 'Male', 'Rock', 'UK', 'Europe', 365],
    ['Kodaline', 2012, 'Group', 4, 'Male', 'Indie', 'IE', 'Europe', 366],
    ['NSYNC', 1997, 'Group', 5, 'Male', 'Pop', 'US', 'North America', 367],
    ['Westlife', 1999, 'Group', 4, 'Male', 'Pop', 'IE', 'Europe', 368],
    ['Creed', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 369],
    ['Louis Armstrong', 1925, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 370],
    ['Foreigner', 1977, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 371],
    ['Of Monsters and Men', 2011, 'Group', 5, 'Mixed', 'Indie', 'IS', 'Europe', 372],
    ['Taio Cruz', 2008, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 373],
    ['ODESZA', 2012, 'Duo', 2, 'Male', 'Electronic', 'US', 'North America', 374],
    ['Blur', 1991, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 375],
    ['Two Door Cinema Club', 2010, 'Group', 3, 'Male', 'Indie', 'IE', 'Europe', 376],
    ['TLC', 1992, 'Group', 3, 'Female', 'R&B', 'US', 'North America', 377],
    ['Wallows', 2017, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 378],
    ['Colbie Caillat', 2007, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 379],
    ['Audioslave', 2002, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 380],
    ['Snow Patrol', 1998, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 381],
    ['The Jackson 5', 1969, 'Group', 5, 'Male', 'R&B', 'US', 'North America', 382],
    ['TOOL', 1992, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 383],
    ['Pixies', 1987, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 384],
    ['Simple Plan', 2002, 'Group', 4, 'Male', 'Rock', 'CA', 'North America', 385],
    ['Gotye', 2006, 'Solo', 1, 'Male', 'Indie', 'AU', 'Oceania', 386],
    ['Kenny Rogers', 1976, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 387],
    ['Tom Petty', 1976, 'Solo', 1, 'Male', 'Rock', 'US', 'North America', 388],
    ['The Who', 1965, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 389],
    ['John Denver', 1969, 'Solo', 1, 'Male', 'Pop', 'US', 'North America', 390],
    ['Cuco', 2016, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 391],
    ['Def Leppard', 1980, 'Group', 5, 'Male', 'Rock', 'UK', 'Europe', 392],
    ['Chicago', 1969, 'Group', 7, 'Male', 'Rock', 'US', 'North America', 393],
    ['Spice Girls', 1996, 'Group', 5, 'Female', 'Pop', 'UK', 'Europe', 394],
    ['Counting Crows', 1993, 'Group', 7, 'Male', 'Rock', 'US', 'North America', 395],
    ['Eurythmics', 1981, 'Duo', 2, 'Mixed', 'Pop', 'UK', 'Europe', 396],
    ['No Doubt', 1992, 'Group', 4, 'Mixed', 'Rock', 'US', 'North America', 397],
    ['Soundgarden', 1988, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 398],
    ['Stone Temple Pilots', 1992, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 399],
    ['Bonnie Tyler', 1977, 'Solo', 1, 'Female', 'Rock', 'UK', 'Europe', 400],
    ['Survivor', 1980, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 401],
    ['Matchbox Twenty', 1996, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 402],
    ['The Temptations', 1964, 'Group', 5, 'Male', 'R&B', 'US', 'North America', 403],
    ['The Verve', 1993, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 404],
    ['Omar Apollo', 2018, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 405],
    ['deadmau5', 2005, 'Solo', 1, 'Male', 'Electronic', 'CA', 'North America', 406],
    ['Franz Ferdinand', 2004, 'Group', 4, 'Male', 'Indie', 'UK', 'Europe', 407],
    ['Capital Cities', 2011, 'Duo', 2, 'Male', 'Indie', 'US', 'North America', 408],
    ['Jeff Buckley', 1994, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 409],
    ['Men I Trust', 2014, 'Group', 3, 'Mixed', 'Indie', 'CA', 'North America', 410],
    ['Ben E. King', 1961, 'Solo', 1, 'Male', 'R&B', 'US', 'North America', 411],
    ['The Temper Trap', 2009, 'Group', 4, 'Male', 'Indie', 'AU', 'Oceania', 412],
    ['The Mamas & The Papas', 1966, 'Group', 4, 'Mixed', 'Pop', 'US', 'North America', 413],
    ['New Order', 1981, 'Group', 4, 'Mixed', 'Electronic', 'UK', 'Europe', 414],
    ['Boston', 1976, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 415],
    ['American Authors', 2013, 'Group', 3, 'Male', 'Indie', 'US', 'North America', 416],
    ['Kansas', 1974, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 417],
    ['Fugees', 1994, 'Group', 3, 'Mixed', 'Hip-hop', 'US', 'North America', 418],
    ['Cascada', 2005, 'Group', 3, 'Mixed', 'Electronic', 'DE', 'Europe', 419],
    ['Good Charlotte', 2000, 'Group', 5, 'Male', 'Rock', 'US', 'North America', 420],
    ['Grouplove', 2011, 'Group', 5, 'Mixed', 'Indie', 'US', 'North America', 421],
    ['Third Eye Blind', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 422],
    ['Motorhead', 1977, 'Group', 3, 'Male', 'Rock', 'UK', 'Europe', 423],
    ['Iron & Wine', 2002, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 424],
    ['Modest Mouse', 1996, 'Group', 4, 'Male', 'Indie', 'US', 'North America', 425],
    ['Take That', 1992, 'Group', 3, 'Male', 'Pop', 'UK', 'Europe', 426],
    ['Europe', 1983, 'Group', 5, 'Male', 'Rock', 'SE', 'Europe', 427],
    ['Big Thief', 2016, 'Group', 4, 'Mixed', 'Indie', 'US', 'North America', 428],
    ['Haddaway', 1993, 'Solo', 1, 'Male', 'Electronic', 'DE', 'Europe', 429],
    ['Rick Astley', 1987, 'Solo', 1, 'Male', 'Pop', 'UK', 'Europe', 430],
    ['Justice', 2007, 'Duo', 2, 'Male', 'Electronic', 'FR', 'Europe', 431],
    ['Corinne Bailey Rae', 2006, 'Solo', 1, 'Female', 'R&B', 'UK', 'Europe', 432],
    ['Joy Division', 1979, 'Group', 4, 'Male', 'Rock', 'UK', 'Europe', 433],
    ['Yellowcard', 1997, 'Group', 4, 'Male', 'Rock', 'US', 'North America', 434],
    ['Gloria Gaynor', 1975, 'Solo', 1, 'Female', 'Pop', 'US', 'North America', 435],
    ['Fatboy Slim', 1996, 'Solo', 1, 'Male', 'Electronic', 'UK', 'Europe', 436],
    ['Passion Pit', 2009, 'Solo', 1, 'Male', 'Indie', 'US', 'North America', 437],
    ['Natalie Imbruglia', 1997, 'Solo', 1, 'Female', 'Pop', 'AU', 'Oceania', 438],
    ['Soft Cell', 1981, 'Duo', 2, 'Male', 'Electronic', 'UK', 'Europe', 439],
    ['Jet', 2003, 'Group', 4, 'Male', 'Rock', 'AU', 'Oceania', 440],
    ['Eiffel 65', 1999, 'Group', 3, 'Male', 'Electronic', 'IT', 'Europe', 441],
    ['The Human League', 1979, 'Group', 3, 'Mixed', 'Electronic', 'UK', 'Europe', 442],
    ['Darude', 1999, 'Solo', 1, 'Male', 'Electronic', 'FI', 'Europe', 443],
    ['Styx', 1972, 'Group', 6, 'Male', 'Rock', 'US', 'North America', 444],
    ['CHIC', 1977, 'Group', 4, 'Mixed', 'R&B', 'US', 'North America', 445],
    ['Pulp', 1983, 'Group', 4, 'Mixed', 'Rock', 'UK', 'Europe', 446],
    ['Hanson', 1997, 'Group', 3, 'Male', 'Pop', 'US', 'North America', 447],
    ['Edith Piaf', 1936, 'Solo', 1, 'Female', 'Pop', 'FR', 'Europe', 448],
    ['boy pablo', 2017, 'Solo', 1, 'Male', 'Indie', 'NO', 'Europe', 449],
    ['Village People', 1977, 'Group', 6, 'Male', 'Pop', 'US', 'North America', 450]
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

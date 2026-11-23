/* Curated & Dynamic Quick Preset Playlists (US iTunes studio-verified).
   Static presets carry pinned studio trackIds; dynamic presets shuffle 50 fresh
   hits from SONGS on every launch. */
(function (root) {
  'use strict';
  const PRESETS = [
  {
    "id": "indo",
    "name": "Indo Pop",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/300x300bb.jpg",
    "tracks": [
      [
        "Hati-Hati di Jalan",
        "Tulus",
        2022,
        1612164667,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/300x300bb.jpg"
      ],
      [
        "Dan...",
        "Sheila On 7",
        1999,
        326500979,
        "https://is1-ssl.mzstatic.com/image/thumb/Music/90/01/6d/mzi.ywjxtlbq.jpg/300x300bb.jpg"
      ],
      [
        "Sephia",
        "Sheila On 7",
        2014,
        883941891,
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/99/71/5e/99715e79-687c-d3d2-232f-186050577e45/886444671422.jpg/300x300bb.jpg"
      ],
      [
        "Kangen (Ku 'Kan Datang)",
        "Dewa 19",
        1999,
        532180262,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3b/ec/30/3bec30fc-5686-1c00-6829-31970f967fd0/Dewa19.jpg/300x300bb.jpg"
      ],
      [
        "Bertaut",
        "Nadin Amizah",
        2020,
        1512861068,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1d/10/9b/1d109b17-1bbf-1894-e774-4d9ad6baa7b3/cover.jpg/300x300bb.jpg"
      ],
      [
        "Sisa Rasa",
        "Mahalini",
        2021,
        1590801595,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/a6/84/cba684fc-720b-485a-ebb0-96e9b79f6b5e/cover.jpg/300x300bb.jpg"
      ],
      [
        "Monokrom",
        "Tulus",
        2016,
        1137907946,
        "https://is1-ssl.mzstatic.com/image/thumb/Music18/v4/d1/8f/41/d18f41cf-45e4-39f4-4d10-0a0af01f7eb7/cover.jpg/300x300bb.jpg"
      ],
      [
        "Pupus",
        "Dewa 19",
        2002,
        533699938,
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/47/e3/10/47e310f4-f7e5-3d7e-b23f-d058810765e4/dewa_cintailah_cinta.jpg/300x300bb.jpg"
      ],
      [
        "Secukupnya",
        "Hindia",
        2019,
        1461737327,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/78/40/1b/78401b33-86a4-8d5b-5cc4-b2a965d8cb28/cover.jpg/300x300bb.jpg"
      ],
      [
        "Evaluasi",
        "Hindia",
        2019,
        1456264904,
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/83/f6/8f/83f68f0a-8a30-9653-a3e2-dc37d9714946/cover.jpg/300x300bb.jpg"
      ],
      [
        "Sorai",
        "Nadin Amizah",
        2019,
        1446698618,
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/f8/ca/26f8cabe-a810-ba69-9239-5ea86c487a96/cover.jpg/300x300bb.jpg"
      ],
      [
        "Sial",
        "Mahalini",
        2023,
        1667204896,
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/ee/3c/96/ee3c9611-4be3-c95d-831a-1b85048c545f/cover.jpg/300x300bb.jpg"
      ],
      [
        "Lantas",
        "Juicy Luicy",
        2020,
        1526601837,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/11/1d/3b/111d3be7-b957-98bf-69b8-49fedbfd74bc/192641542428_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Tampar",
        "Juicy Luicy",
        2022,
        1615700927,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c1/97/e2/c197e2d2-a9f4-fd0f-f670-de2f88f96879/192641986017_Cover.jpg/300x300bb.jpg"
      ],
      [
        "To the Bone",
        "Pamungkas",
        2019,
        1787344772,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f4/42/c7/f442c726-f2a1-c045-829e-45f33f2fe1d0/3615939061533.png/300x300bb.jpg"
      ],
      [
        "Akad",
        "Payung Teduh",
        2017,
        1318701282,
        "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/6d/fa/28/6dfa28fc-4973-2319-a633-6193635ab8d7/cover.jpg/300x300bb.jpg"
      ],
      [
        "Zona Nyaman",
        "Fourtwnty",
        2018,
        1503120873,
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/83/47/85/8347855c-2035-9182-039b-3dffa8c3d64d/859737649002_cover.jpg/300x300bb.jpg"
      ],
      [
        "Tutur Batin",
        "Yura Yunita",
        2021,
        1586629457,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/36/da/2f/36da2fee-3e4c-fbc9-aa92-4db1216b907f/cover.jpg/300x300bb.jpg"
      ],
      [
        "Gala bunga matahari",
        "Sal Priadi",
        2024,
        1737268494,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/a8/4c/faa84c4f-0f09-3730-6460-8c53e9dc159d/cover.jpg/300x300bb.jpg"
      ],
      [
        "Komang",
        "Raim Laode",
        2022,
        1861715593,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6c/ce/b6/6cceb619-db30-d4d9-028b-b8fea5607994/6179.jpg/300x300bb.jpg"
      ],
      [
        "Cinta Luar Biasa",
        "Andmesh",
        2018,
        1483031827,
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/16/03/44/160344ed-9ce4-6338-8f8a-c88cb651f277/cover.jpg/300x300bb.jpg"
      ],
      [
        "Surat Cinta Untuk Starla",
        "Virgoun",
        2016,
        1882385863,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/12/70/8c/12708cff-7c7c-54e4-246c-77aed39bfc9a/8995888627628_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Runtuh",
        "Feby Putri & Fiersa Besari",
        2021,
        1594265417,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3d/28/f8/3d28f883-fc1a-a88d-3768-2db3a0c0d461/cover.jpg/300x300bb.jpg"
      ],
      [
        "Kasih Putih",
        "Glenn Fredly",
        2000,
        326503967,
        "https://is1-ssl.mzstatic.com/image/thumb/Music/b6/fe/be/mzi.mvgrkdcf.jpg/300x300bb.jpg"
      ],
      [
        "Lebih Dari Sekedar Cantik",
        "Kahitna",
        2010,
        808649228,
        "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/54/b9/00/54b90031-1726-c16b-981d-8f1c351a6577/Kahitna_-_Lebih_Dari_Sekedar_Cantik.jpg/300x300bb.jpg"
      ],
      [
        "Hingga Tua Bersama",
        "Rizky Febian",
        2021,
        1567263887,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/34/fb/b9/34fbb9af-cb44-5fc4-ac8e-b2aca5b4f912/artwork.jpg/300x300bb.jpg"
      ],
      [
        "Melawan Restu",
        "Mahalini",
        2021,
        1557456160,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a7/9e/bd/a79ebd67-f79d-b5ea-c305-8463b06d206a/cover.jpg/300x300bb.jpg"
      ],
      [
        "Interaksi",
        "Tulus",
        2022,
        1612164256,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/18/10/6f1810e0-2d6a-a456-1362-de607c70408a/cover.jpg/300x300bb.jpg"
      ],
      [
        "Pamit",
        "Tulus",
        2016,
        1086493644,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b1/8a/1e/b18a1ebe-59bb-6e49-f64b-5be2c40e510f/cover.jpg/300x300bb.jpg"
      ],
      [
        "Sewindu",
        "Tulus",
        2011,
        918912453,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/63/22/42/632242fa-4a88-ccde-fa08-d8688d492262/cover.jpg/300x300bb.jpg"
      ],
      [
        "Cincin",
        "Hindia",
        2023,
        1691585282,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7f/5f/99/7f5f99c7-1ddd-93cb-9b79-7efec9d6dd53/cover.jpg/300x300bb.jpg"
      ],
      [
        "Membasuh (feat. Rara Sekar)",
        "Hindia",
        2019,
        1481804581,
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/2a/da/57/2ada5765-472f-3193-11a3-861db06da99d/cover.jpg/300x300bb.jpg"
      ],
      [
        "Kemesraan",
        "Iwan Fals, Chrisye, Rafika Duri, Betharia Sonatha, Jamal Mirdad, Etrie Jayanthie, Nani Sugianto & Itang Yunasz",
        1990,
        1824130839,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/25/d7/7c/25d77c43-c5cd-8019-d2ce-15817fcd541d/25UMGIM82473.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Dia",
        "Anji",
        2016,
        1368025193,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cf/3c/41/cf3c41a4-6cef-726a-12c0-b3aaf19dddc8/Dia-iTunes_copy.jpg/300x300bb.jpg"
      ],
      [
        "Bukti",
        "Virgoun",
        2017,
        1882285189,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/63/d4/44/63d44485-b321-f5d9-07ed-0b718411b063/8995888635524_Cover.jpg/300x300bb.jpg"
      ]
    ]
  },
  {
    "id": "kpop",
    "name": "K-Pop",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/22/f3/8f/22f38fb9-1690-326a-d891-7aa946c2b06f/195497623273_Cover.jpg/300x300bb.jpg",
    "tracks": [
      [
        "Dynamite",
        "BTS",
        2020,
        1596532400,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/22/f3/8f/22f38fb9-1690-326a-d891-7aa946c2b06f/195497623273_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Butter",
        "BTS",
        2021,
        1627575769,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/f7/68/9c/f7689ce3-6d41-60cd-62d2-57a91ddf5b9d/196922067341_Cover.jpg/300x300bb.jpg"
      ],
      [
        "How You Like That",
        "BLACKPINK",
        2020,
        1533894669,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c3/64/46/c364465f-6271-8aae-93a8-b9979d2befe5/20UMGIM82075.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Spring Day",
        "BTS",
        2017,
        1596529381,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ce/fb/eb/cefbebd4-d53b-8d6c-33cf-2ee55408bd79/8804775077494_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Kill This Love",
        "BLACKPINK",
        2019,
        1551479992,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d6/2a/db/d62adbe1-6994-581c-b3b2-aeacafa35c1d/19UMGIM30819.rgb.jpg/300x300bb.jpg"
      ],
      [
        "How You Like That (Japan Version)",
        "BLACKPINK",
        2021,
        1576278866,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6f/9a/bd/6f9abd30-9001-110c-7724-86e466eca1c4/21UMGIM51685.rgb.jpg/300x300bb.jpg"
      ],
      [
        "OMG",
        "NewJeans",
        2023,
        1659513445,
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/48/96/08/4896085e-b550-cb0a-3e5b-1f203521cb82/196922265464_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Super Shy",
        "NewJeans",
        2023,
        1692686518,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/63/e5/e2/63e5e2e4-829b-924d-a1dc-8058a1d69bd4/196922462702_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Hype Boy",
        "NewJeans",
        2022,
        1635469851,
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4e/64/34/4e64344b-3ac6-c503-2c41-257a15401416/192641873096_Cover.jpg/300x300bb.jpg"
      ],
      [
        "What is Love?",
        "TWICE",
        2018,
        1555390083,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7e/41/69/7e4169e8-8358-27ff-66b4-1564ec800abd/00602508875137_Cover.jpg/300x300bb.jpg"
      ],
      [
        "FANCY",
        "TWICE",
        2019,
        1555390187,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/03/76/e6/0376e6f9-f6d8-68f7-ae85-1a4ef17002aa/00602508875229_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Super",
        "SEVENTEEN",
        2023,
        1681324047,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d1/66/eb/d166eb7e-7210-b3ff-be39-638cd37bfc89/196922401282_Cover.jpg/300x300bb.jpg"
      ],
      [
        "God's Menu",
        "Stray Kids",
        2020,
        1608251966,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a8/99/a9/a899a9bb-bddc-1ce6-61d0-bea282420aa3/192641939464_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Next Level",
        "aespa",
        2021,
        1567326688,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/60/8d/ac/608dacc2-d6d6-462d-26f0-d693e4364751/artwork.jpg/300x300bb.jpg"
      ],
      [
        "Supernova",
        "aespa",
        2024,
        1773694544,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/7e/e0/507ee09f-ccfd-1e3c-af90-ca5e92b1221b/00888735949869_Cover.jpg/300x300bb.jpg"
      ],
      [
        "LOVE DIVE",
        "IVE",
        2022,
        1616804152,
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/67/f8/16/67f8164a-bfc2-f29b-e241-800426a968ef/cover_KM0015013_1.jpg/300x300bb.jpg"
      ],
      [
        "I AM",
        "IVE",
        2023,
        1680047366,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3a/23/b7/3a23b7f4-0b43-df9d-b7e4-14f992443324/197188335663.jpg/300x300bb.jpg"
      ],
      [
        "ANTIFRAGILE",
        "LE SSERAFIM",
        2022,
        1647830390,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c8/79/da/c879dadf-db1e-95a5-caf5-b18c7c81d2b6/192641874413_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Love Shot",
        "EXO",
        2018,
        1446231541,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/41/9a/62/419a621b-bd1a-c9ba-2c77-fe3b233a33b4/EXO_DC.jpg/300x300bb.jpg"
      ],
      [
        "BANG BANG BANG",
        "BIGBANG",
        2015,
        1313176083,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5b/9b/8e/5b9b8ef2-998e-1210-8454-dfebfbf6271c/BB_COVER_IMAGE_4000.jpg/300x300bb.jpg"
      ],
      [
        "Gangnam Style",
        "PSY",
        2012,
        1445144527,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7c/52/87/7c5287bc-818f-55ed-e607-08b052963632/12UMGIM50914.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Cupid",
        "FIFTY FIFTY",
        2022,
        1762365714,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/6b/2e/aa/6b2eaa77-af21-4b0d-5ae0-2062cbf44e55/196872355437.jpg/300x300bb.jpg"
      ],
      [
        "Seven (Clean Ver.)",
        "Jung Kook & Latto",
        2023,
        1715412653,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f2/54/08/f254081d-c7e2-6cd6-f7c5-dedb56fd95bd/196922710582_Cover.jpg/300x300bb.jpg"
      ],
      [
        "APT.",
        "ROSÉ & Bruno Mars",
        2024,
        1773452221,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2d/1a/7d/2d1a7d91-587e-0ceb-d434-327bd66d9e86/075679628312.jpg/300x300bb.jpg"
      ],
      [
        "Magnetic",
        "ILLIT",
        2024,
        1734500896,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/49/1e/3e491e43-4961-21ab-2abe-37fb1c0feb40/196922879227_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Boy With Luv (feat. Halsey)",
        "BTS",
        2019,
        1599172208,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/40/d4/93/40d493e3-ac9e-1746-8d4c-f380f27c97cb/193483706238_Cover.jpg/300x300bb.jpg"
      ],
      [
        "FAKE LOVE",
        "BTS",
        2018,
        1598730630,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/00/2c/ff002c29-6da9-1a26-16b3-282a73180366/192562871591_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Pink Venom",
        "BLACKPINK",
        2022,
        1639174482,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/72/48/88/72488832-558c-fcba-4aa0-03d88dc79eb3/22UMGIM87808.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Shut Down",
        "BLACKPINK",
        2022,
        1644431999,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/52/8e/5a/528e5a30-52b0-b68c-f184-635fcf15e6d7/22UM1IM01017.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Ditto",
        "NewJeans",
        2022,
        1657231962,
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/29/42/f629426e-92fe-535c-cbe4-76e70850819b/196922287107_Cover.jpg/300x300bb.jpg"
      ],
      [
        "ETA",
        "NewJeans",
        2023,
        1695951900,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d3/4b/7e/d34b7e1e-af3b-43b6-2949-7a8c652a1bc9/196922462726_Cover.jpg/300x300bb.jpg"
      ],
      [
        "Feel Special",
        "TWICE",
        2019,
        1556087008,
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/75/bb/cc/75bbcc8c-bc12-983b-196f-bb6e355cc978/00602508875281_Cover.jpg/300x300bb.jpg"
      ],
      [
        "TT",
        "TWICE",
        2016,
        1555401122,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/0e/c5/67/0ec5678b-9070-ac48-f01d-c8af72b92d01/00602508870064_Cover.jpg/300x300bb.jpg"
      ],
      [
        "LALISA",
        "LISA",
        2021,
        1584836387,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ee/8a/62/ee8a62ef-d973-b255-204e-be6a1fad0da7/21UMGIM86117.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Standing Next to You",
        "Jung Kook",
        2023,
        1709554997,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/86/78/b4/8678b4b3-2341-7239-b6cb-bcfdaef0e4e0/196922656545_Cover.jpg/300x300bb.jpg"
      ]
    ]
  },
  {
    "id": "anime",
    "name": "Anime",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/3a/17/eb/3a17eb30-eacb-82eb-51df-d1321dbb55bc/197188492205.jpg/300x300bb.jpg",
    "tracks": [
      [
        "Idol",
        "YOASOBI",
        2023,
        1679278167,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/3a/17/eb/3a17eb30-eacb-82eb-51df-d1321dbb55bc/197188492205.jpg/300x300bb.jpg"
      ],
      [
        "Yoru ni kakeru",
        "YOASOBI",
        2019,
        1542182776,
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7f/8c/90/7f8c90dd-e11f-30d5-271d-4b72eee970bd/195497666737.jpg/300x300bb.jpg"
      ],
      [
        "KICK BACK",
        "Kenshi Yonezu",
        2022,
        1648272180,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/4e/a8/75/4ea875d1-bdb6-9b83-185a-646391cbffbd/4547366589849.jpg/300x300bb.jpg"
      ],
      [
        "Lemon",
        "Kenshi Yonezu",
        2018,
        1537460612,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/86/b0/9d/86b09d63-367a-563a-1e24-d5d62c220ac8/jacket_SRCL09749B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Peace Sign",
        "Kenshi Yonezu",
        2017,
        1538275660,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1b/7a/5e/1b7a5e77-b0c4-6e32-f3ee-c09c70f8378e/jacket_SRCL09571B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Gurenge",
        "LiSA",
        2019,
        1529543135,
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/51/b3/58/51b35899-bda2-50d2-2c00-b2b95999b3c3/4547366473681.jpg/300x300bb.jpg"
      ],
      [
        "homura",
        "LiSA",
        2020,
        1531847485,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/88/ce/67/88ce6774-3358-e238-5244-1b0788adea50/4547366475562.jpg/300x300bb.jpg"
      ],
      [
        "Bling-Bang-Bang-Born",
        "Creepy Nuts",
        2024,
        1720332181,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/12/81/dc/1281dc28-48e6-5ff7-642d-6cf4d487d9e0/4547366660890.jpg/300x300bb.jpg"
      ],
      [
        "Otonoke",
        "Creepy Nuts",
        2024,
        1771603031,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2c/66/b5/2c66b5b5-a46f-1064-4802-fe82c0e56200/4547366705638.jpg/300x300bb.jpg"
      ],
      [
        "Cry Baby",
        "OFFICIAL HIGE DANDISM",
        2021,
        1563683060,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e5/06/f2/e506f2a5-ebde-dd12-b347-7cf322d40644/PCSP_03508_A.jpg/300x300bb.jpg"
      ],
      [
        "Mixed Nuts",
        "OFFICIAL HIGE DANDISM",
        2022,
        1628261505,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/53/5a/c7/535ac721-ead3-a0c4-036e-6574a4a260d1/PCCA_06138_A.jpg/300x300bb.jpg"
      ],
      [
        "Kaikai Kitan",
        "EVE",
        2020,
        1542180247,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/00/f7/77/00f77709-2f23-8698-f35b-a3e7685b3d17/4988061912820.jpg/300x300bb.jpg"
      ],
      [
        "Zankyosanka",
        "Aimer",
        2021,
        1594814706,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c9/40/9e/c9409e84-c0ea-c389-3be3-2343ec3dfb3b/4547366539806.jpg/300x300bb.jpg"
      ],
      [
        "SPECIALZ",
        "King Gnu",
        2023,
        1702823583,
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/aa/33/55/aa335541-9932-d73c-6b1e-62bd484fc83d/4547366642308.jpg/300x300bb.jpg"
      ],
      [
        "Sparkle",
        "RADWIMPS",
        2016,
        1523038689,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fa/1d/26/fa1d26c2-f6fa-b317-ef04-d23931e2441a/859755977873_cover.jpg/300x300bb.jpg"
      ],
      [
        "Zenzenzense - Movie Ver.",
        "RADWIMPS",
        2016,
        1434005783,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/b3/8c/56b38c05-1728-402c-016c-c1e4b0635be8/4988031167618_cover.jpg/300x300bb.jpg"
      ],
      [
        "Suzume (feat. Toaka)",
        "RADWIMPS",
        2022,
        1647112151,
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/eb/0c/e3/eb0ce3d8-b9b9-ce8d-47f9-38d147128dee/0602448618207_cover.jpg/300x300bb.jpg"
      ],
      [
        "Unravel",
        "TK from Ling tosite sigure",
        2014,
        1538098094,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b5/28/30/b5283070-a9c6-29ba-6644-635f566f26a4/jacket_AICL02717B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Blue Bird",
        "Ikimonogakari",
        2016,
        1089186523,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/f2/f7/48f2f77a-1229-2f65-87da-5efa9dab85b1/886445760033.jpg/300x300bb.jpg"
      ],
      [
        "Silhouette",
        "KANA-BOON",
        2014,
        1538157315,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/32/6b/cc/326bcc4d-5c22-1451-4935-4d693cde2ad1/jacket_KSCL02535B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "New Genesis",
        "ADO",
        2022,
        1636446946,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/42/a3/cc/42a3cc35-fdb7-2ae7-02f3-e5a90f32eb8e/22UMGIM74128.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Shinunoga E-Wa",
        "Fujii Kaze",
        2020,
        1505498792,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/96/4e/5b/964e5b6e-4766-63ba-7e50-9f8a5bd0569e/20UMGIM17280.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Again",
        "YUI",
        2009,
        1537445612,
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/f5/b4/ef/f5b4ef5e-653c-0a15-0f4b-86f87b2aad9c/jacket_SRCL08197B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "NIGHT DANCER",
        "IMASE",
        2022,
        1639023912,
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c2/49/87/c249873f-fa61-9d61-52aa-a7e1d780c8b3/22UMGIM81500.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Inferno",
        "Mrs. GREEN APPLE",
        2019,
        1480313619,
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/86/12/f4/8612f495-10a5-0189-0f39-6644100a2434/19UMGIM67614.rgb.jpg/300x300bb.jpg"
      ],
      [
        "Guren No Yumiya",
        "Linked Horizon",
        2013,
        666788983,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/68/3d/2b/683d2b87-f72d-9aa1-c6a5-956d3d25c80e/PCCA_03837_itunes.png/300x300bb.jpg"
      ],
      [
        "Crossing Field",
        "LiSA",
        2012,
        1537785962,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/bc/b1/d0/bcb1d0bc-8736-61ac-cb16-51c623c2b0bc/jacket_SVWC07875B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Oath Sign",
        "LiSA",
        2011,
        1537785552,
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b6/e8/75/b6e87557-292a-463e-2fd7-daadff97ba51/jacket_SVWC07804B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Brave Shine",
        "Aimer",
        2015,
        1536130474,
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a7/e4/91/a7e4914b-3e96-d119-0ce7-d9e7d5ab113a/4560429730019.jpg/300x300bb.jpg"
      ],
      [
        "A Cruel Angel's Thesis (Director's Edit Version)",
        "Yoko Takahashi",
        1995,
        1500836562,
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/77/65/fa/7765fa66-2af8-dce3-fb4c-18cc68d6ba77/886448179139.jpg/300x300bb.jpg"
      ],
      [
        "We Are!",
        "Kitadani Hiroshi",
        1999,
        1770907052,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/c2/f0/31c2f094-7046-5a0e-b71e-96400d455369/COKM-45371.jpg/300x300bb.jpg"
      ],
      [
        "Haruka Kanata",
        "Asian Kung-Fu Generation",
        2002,
        1536394884,
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/48/96/3e/48963e5a-75d7-7a8b-132c-233f26ebd70d/jacket_KSCL01917B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Rewrite",
        "Asian Kung-Fu Generation",
        2004,
        1536364096,
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/90/54/9b90547e-6743-bd7b-4d17-c6a485c0124e/4560427295664.jpg/300x300bb.jpg"
      ],
      [
        "Sign",
        "FLOW",
        2013,
        1536382006,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d1/36/28/d1362856-9a92-94bb-213f-80b767322a13/jacket_KSCL01600B00Z_550.jpg/300x300bb.jpg"
      ],
      [
        "Colors",
        "FLOW",
        2006,
        1538160322,
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cd/ca/89/cdca8927-8181-fe15-976c-e4ece60f53ea/jacket_KSCL03035B00Z_550.jpg/300x300bb.jpg"
      ]
    ]
  },
  {
    "id": "throwback",
    "name": "2000s",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/53/a7/7f/53a77fab-c54c-a57b-8130-248fc12d0c80/093624948995.jpg/300x300bb.jpg",
    "filter": {
      "era": "y00",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "y10s",
    "name": "2010s Hits",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/43/03/57/430357e0-e142-8d4d-ca56-87f4bd41e017/886444976145.jpg/200x200bb.jpg",
    "filter": {
      "era": "y10",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "y90s",
    "name": "90s Hits",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/95/fd/b9/95fdb9b2-6d2b-92a6-97f2-51c1a6d77f1a/00602527874609.rgb.jpg/300x300bb.jpg",
    "filter": {
      "era": "old",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "y20s",
    "name": "2020s Pop",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/300x300bb.jpg",
    "filter": {
      "genre": "pop",
      "era": "y20",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "rock",
    "name": "Rock Hits",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4d/08/2a/4d082a9e-7898-1aa1-a02f-339810058d9e/14DMGIM05632.rgb.jpg/300x300bb.jpg",
    "filter": {
      "genre": "rock",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "hiphop",
    "name": "Hip-Hop",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/e7/49/8f/e7498f65-df8f-bead-d6e3-2a8d4d642a79/886447235317.jpg/300x300bb.jpg",
    "filter": {
      "genre": "hiphop",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "rnb",
    "name": "R&B & Soul",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/300x300bb.jpg",
    "filter": {
      "genre": "rnb",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "indie",
    "name": "Indie Chill",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/300x300bb.jpg",
    "filter": {
      "genre": "indie",
      "tierMax": 2,
      "limit": 50
    }
  },
  {
    "id": "edm",
    "name": "EDM & Dance",
    "cover": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/18/5b/1e/185b1ef5-5d97-19d8-aebf-8e29e41874ef/13UAAIM59255.rgb.jpg/300x300bb.jpg",
    "filter": {
      "genre": "edm",
      "tierMax": 2,
      "limit": 50
    }
  }
];
  if (typeof module === 'object' && module.exports) module.exports = PRESETS;
  else root.TUNEUP_PRESETS = PRESETS;
})(typeof window === 'object' ? window : globalThis);

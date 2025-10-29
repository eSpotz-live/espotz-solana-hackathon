/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tournament.json`.
 */
export type Tournament = {
  "address": "BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv",
  "metadata": {
    "name": "tournament",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Espotz Tournament Platform Smart Contract"
  },
  "instructions": [
    {
      "name": "cancelTournament",
      "docs": [
        "Cancel tournament (admin only)"
      ],
      "discriminator": [
        249,
        227,
        133,
        5,
        9,
        142,
        29,
        122
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimRefund",
      "docs": [
        "Claim refund for cancelled tournament"
      ],
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "tournament"
        },
        {
          "name": "playerEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createTournament",
      "docs": [
        "Create a new tournament"
      ],
      "discriminator": [
        158,
        137,
        233,
        231,
        73,
        132,
        191,
        68
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  117,
                  114,
                  110,
                  97,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u32"
        },
        {
          "name": "gameType",
          "type": {
            "defined": {
              "name": "gameType"
            }
          }
        },
        {
          "name": "entryFee",
          "type": "u64"
        },
        {
          "name": "maxPlayers",
          "type": "u16"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "distributePrizes",
      "docs": [
        "Distribute prizes to winners (admin only)"
      ],
      "discriminator": [
        154,
        99,
        201,
        93,
        82,
        104,
        73,
        232
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "winners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "amounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "registerPlayer",
      "docs": [
        "Register a player for a tournament"
      ],
      "discriminator": [
        242,
        146,
        194,
        234,
        234,
        145,
        228,
        42
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true
        },
        {
          "name": "playerEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "startTournament",
      "docs": [
        "Start tournament (changes status from Registration to Active)"
      ],
      "discriminator": [
        164,
        168,
        208,
        157,
        43,
        10,
        220,
        241
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "submitResults",
      "docs": [
        "Submit tournament results (admin only)"
      ],
      "discriminator": [
        22,
        16,
        250,
        159,
        91,
        235,
        19,
        57
      ],
      "accounts": [
        {
          "name": "tournament",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "winners",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "playerEntry",
      "discriminator": [
        158,
        6,
        39,
        104,
        234,
        4,
        153,
        255
      ]
    },
    {
      "name": "tournament",
      "discriminator": [
        175,
        139,
        119,
        242,
        115,
        194,
        57,
        92
      ]
    },
    {
      "name": "vaultAuthority",
      "discriminator": [
        132,
        34,
        187,
        202,
        202,
        195,
        211,
        53
      ]
    }
  ],
  "events": [
    {
      "name": "playerRegistered",
      "discriminator": [
        175,
        78,
        252,
        170,
        75,
        230,
        36,
        251
      ]
    },
    {
      "name": "prizesDistributed",
      "discriminator": [
        109,
        23,
        248,
        16,
        66,
        223,
        21,
        83
      ]
    },
    {
      "name": "refundClaimed",
      "discriminator": [
        136,
        64,
        242,
        99,
        4,
        244,
        208,
        130
      ]
    },
    {
      "name": "resultsSubmitted",
      "discriminator": [
        115,
        110,
        15,
        144,
        27,
        92,
        181,
        41
      ]
    },
    {
      "name": "tournamentCancelled",
      "discriminator": [
        118,
        92,
        146,
        131,
        165,
        72,
        81,
        120
      ]
    },
    {
      "name": "tournamentCreated",
      "discriminator": [
        102,
        32,
        240,
        45,
        52,
        64,
        97,
        0
      ]
    },
    {
      "name": "tournamentStarted",
      "discriminator": [
        200,
        157,
        174,
        194,
        174,
        219,
        107,
        44
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "tournamentAlreadyStarted",
      "msg": "Tournament has already started"
    },
    {
      "code": 6001,
      "name": "tournamentFull",
      "msg": "Tournament is full"
    },
    {
      "code": 6002,
      "name": "registrationClosed",
      "msg": "Registration period has ended"
    },
    {
      "code": 6003,
      "name": "tournamentNotStarted",
      "msg": "Tournament has not started yet"
    },
    {
      "code": 6004,
      "name": "tournamentNotEnded",
      "msg": "Tournament has not ended yet"
    },
    {
      "code": 6005,
      "name": "invalidTournamentStatus",
      "msg": "Tournament is not in the correct status for this operation"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "Unauthorized: Only admin can perform this action"
    },
    {
      "code": 6007,
      "name": "invalidEntryFee",
      "msg": "Invalid entry fee amount"
    },
    {
      "code": 6008,
      "name": "invalidParameters",
      "msg": "Invalid tournament parameters"
    },
    {
      "code": 6009,
      "name": "invalidTimes",
      "msg": "Start time must be before end time"
    },
    {
      "code": 6010,
      "name": "insufficientPrizePool",
      "msg": "Prize distribution exceeds prize pool"
    },
    {
      "code": 6011,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6012,
      "name": "underflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6013,
      "name": "mismatchedArrays",
      "msg": "Winner list does not match amount list"
    },
    {
      "code": 6014,
      "name": "tournamentNotCancelled",
      "msg": "Tournament is not cancelled"
    },
    {
      "code": 6015,
      "name": "alreadyRefunded",
      "msg": "Player already refunded"
    },
    {
      "code": 6016,
      "name": "cannotCancelAfterEnd",
      "msg": "Tournament cannot be cancelled after it has ended"
    },
    {
      "code": 6017,
      "name": "invalidMint",
      "msg": "Invalid USDC mint address"
    },
    {
      "code": 6018,
      "name": "playerNotRegistered",
      "msg": "Player is not registered for this tournament"
    }
  ],
  "types": [
    {
      "name": "gameType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "fortnite"
          },
          {
            "name": "pubgMobile"
          },
          {
            "name": "callOfDutyMobile"
          },
          {
            "name": "valorant"
          },
          {
            "name": "apex"
          },
          {
            "name": "warzone"
          },
          {
            "name": "other"
          }
        ]
      }
    },
    {
      "name": "playerEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "docs": [
              "Associated tournament"
            ],
            "type": "pubkey"
          },
          {
            "name": "player",
            "docs": [
              "Player wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "entryTime",
            "docs": [
              "Registration timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "refunded",
            "docs": [
              "Whether player has been refunded"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "entryTime",
            "type": "i64"
          },
          {
            "name": "currentPlayers",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "prizesDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "winners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "amounts",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "refundClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "resultsSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "winners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tournament",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unique tournament ID"
            ],
            "type": "u32"
          },
          {
            "name": "admin",
            "docs": [
              "Tournament operator/admin"
            ],
            "type": "pubkey"
          },
          {
            "name": "status",
            "docs": [
              "Current tournament status"
            ],
            "type": {
              "defined": {
                "name": "tournamentStatus"
              }
            }
          },
          {
            "name": "gameType",
            "docs": [
              "Game type (Fortnite, PUBG Mobile, etc.)"
            ],
            "type": {
              "defined": {
                "name": "gameType"
              }
            }
          },
          {
            "name": "entryFee",
            "docs": [
              "Entry fee in USDC (lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "prizePool",
            "docs": [
              "Total prize pool in USDC"
            ],
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "docs": [
              "Maximum number of players"
            ],
            "type": "u16"
          },
          {
            "name": "currentPlayers",
            "docs": [
              "Current registered players"
            ],
            "type": "u16"
          },
          {
            "name": "startTime",
            "docs": [
              "Tournament start time (Unix timestamp)"
            ],
            "type": "i64"
          },
          {
            "name": "endTime",
            "docs": [
              "Tournament end time (Unix timestamp)"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tournamentCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tournamentCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u32"
          },
          {
            "name": "gameType",
            "type": {
              "defined": {
                "name": "gameType"
              }
            }
          },
          {
            "name": "entryFee",
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "type": "u16"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tournamentStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tournamentStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "registration"
          },
          {
            "name": "active"
          },
          {
            "name": "ended"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "vaultAuthority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "docs": [
              "Associated tournament"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};

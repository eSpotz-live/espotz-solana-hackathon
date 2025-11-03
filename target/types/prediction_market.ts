/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_market.json`.
 */
export type PredictionMarket = {
  "address": "MD63kQkcMMZdw2fCBMNxH3WDj7n1nbb1x1irTMwEUBP",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Espotz Prediction Market with Switchboard Oracle Integration"
  },
  "instructions": [
    {
      "name": "claimWinnings",
      "docs": [
        "Claim winnings after market settlement"
      ],
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "market",
          "relations": [
            "position"
          ]
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "vaultToken",
          "writable": true
        },
        {
          "name": "vaultAuthority"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeMarket",
      "docs": [
        "Close market for betting (after closes_at time)"
      ],
      "discriminator": [
        88,
        154,
        248,
        186,
        48,
        14,
        123,
        244
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "market"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createMarket",
      "docs": [
        "Create a new prediction market for a tournament"
      ],
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  101,
                  100,
                  105,
                  99,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tournament"
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "tournament"
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
          "name": "marketId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "marketType",
          "type": {
            "defined": {
              "name": "marketType"
            }
          }
        },
        {
          "name": "closesAt",
          "type": "i64"
        },
        {
          "name": "oracleFeed",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initPosition",
      "docs": [
        "Initialize user position before placing first bet"
      ],
      "discriminator": [
        197,
        20,
        10,
        1,
        97,
        160,
        177,
        91
      ],
      "accounts": [
        {
          "name": "market"
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  45,
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
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
          "name": "outcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        }
      ]
    },
    {
      "name": "placeBet",
      "docs": [
        "Place a bet on a market outcome"
      ],
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultToken",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "settleMarket",
      "docs": [
        "Settle market with winning outcome (admin manual resolution for MVP)"
      ],
      "discriminator": [
        193,
        153,
        95,
        216,
        166,
        6,
        144,
        217
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "market"
          ]
        }
      ],
      "args": [
        {
          "name": "winningOutcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "predictionMarket",
      "discriminator": [
        117,
        150,
        97,
        152,
        119,
        58,
        51,
        58
      ]
    },
    {
      "name": "userPosition",
      "discriminator": [
        251,
        248,
        209,
        245,
        83,
        234,
        17,
        27
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "marketNotOpen",
      "msg": "Market is not open for betting"
    },
    {
      "code": 6001,
      "name": "marketNotClosed",
      "msg": "Market is not closed yet"
    },
    {
      "code": 6002,
      "name": "marketAlreadySettled",
      "msg": "Market is already settled"
    },
    {
      "code": 6003,
      "name": "marketNotSettled",
      "msg": "Market is not settled yet"
    },
    {
      "code": 6004,
      "name": "invalidBetAmount",
      "msg": "Invalid bet amount (must be > 0)"
    },
    {
      "code": 6005,
      "name": "alreadyClaimed",
      "msg": "User has already claimed their payout"
    },
    {
      "code": 6006,
      "name": "noWinnings",
      "msg": "User has no winnings to claim"
    },
    {
      "code": 6007,
      "name": "staleOracleData",
      "msg": "Oracle data is stale"
    },
    {
      "code": 6008,
      "name": "invalidOracleResponse",
      "msg": "Invalid oracle response"
    },
    {
      "code": 6009,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in pool"
    },
    {
      "code": 6010,
      "name": "marketNotStarted",
      "msg": "Market has not started yet"
    },
    {
      "code": 6011,
      "name": "unauthorized",
      "msg": "Unauthorized admin access"
    },
    {
      "code": 6012,
      "name": "invalidMarketId",
      "msg": "Invalid market ID"
    },
    {
      "code": 6013,
      "name": "calculationOverflow",
      "msg": "Calculation overflow"
    }
  ],
  "types": [
    {
      "name": "marketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "closed"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "marketType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "firstKill"
          },
          {
            "name": "mvp"
          },
          {
            "name": "totalKills"
          },
          {
            "name": "roundWinner"
          },
          {
            "name": "matchWinner"
          }
        ]
      }
    },
    {
      "name": "outcome",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "yes"
          },
          {
            "name": "no"
          }
        ]
      }
    },
    {
      "name": "predictionMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tournament",
            "docs": [
              "Tournament this market is associated with"
            ],
            "type": "pubkey"
          },
          {
            "name": "marketId",
            "docs": [
              "Unique market ID (e.g., \"first-kill\", \"mvp\", \"total-kills\")"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "admin",
            "docs": [
              "Market creator (admin)"
            ],
            "type": "pubkey"
          },
          {
            "name": "marketType",
            "docs": [
              "Market type"
            ],
            "type": {
              "defined": {
                "name": "marketType"
              }
            }
          },
          {
            "name": "status",
            "docs": [
              "Current status"
            ],
            "type": {
              "defined": {
                "name": "marketStatus"
              }
            }
          },
          {
            "name": "yesPool",
            "docs": [
              "YES liquidity pool (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "noPool",
            "docs": [
              "NO liquidity pool (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "yesShares",
            "docs": [
              "Total YES shares issued"
            ],
            "type": "u64"
          },
          {
            "name": "noShares",
            "docs": [
              "Total NO shares issued"
            ],
            "type": "u64"
          },
          {
            "name": "oracleFeed",
            "docs": [
              "Oracle feed address (Switchboard)"
            ],
            "type": "pubkey"
          },
          {
            "name": "winningOutcome",
            "docs": [
              "Winning outcome (set after settlement)"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "outcome"
                }
              }
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when market was created"
            ],
            "type": "i64"
          },
          {
            "name": "closesAt",
            "docs": [
              "Timestamp when market closes for betting"
            ],
            "type": "i64"
          },
          {
            "name": "settledAt",
            "docs": [
              "Timestamp when market was settled"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "docs": [
              "Market this position belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "user",
            "docs": [
              "User who owns this position"
            ],
            "type": "pubkey"
          },
          {
            "name": "outcome",
            "docs": [
              "Which outcome the user bet on"
            ],
            "type": {
              "defined": {
                "name": "outcome"
              }
            }
          },
          {
            "name": "amount",
            "docs": [
              "Amount of SOL bet"
            ],
            "type": "u64"
          },
          {
            "name": "shares",
            "docs": [
              "Number of shares owned"
            ],
            "type": "u64"
          },
          {
            "name": "claimed",
            "docs": [
              "Whether the user has claimed their payout"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when position was created"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};

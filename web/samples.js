export const samples = [
  {
    "equation": "2x + 8 = 20",
    "answer": "x = 6",
    "detail": "One real solution.",
    "steps": [
      [
        "Subtract 8 from both sides",
        "2x = 12",
        "Keep both sides balanced."
      ],
      [
        "Divide both sides by 2",
        "x = 6",
        "Isolate the unknown."
      ]
    ],
    "check": [
      "Substitute x = 6 into the original equation.",
      "2(6) + 8 = 20",
      "12 + 8 = 20 ✓"
    ]
  },
  {
    "equation": "x² − 5x + 6 = 0",
    "answer": "x = 2 or x = 3",
    "detail": "Two real solutions.",
    "steps": [
      [
        "Find two numbers that multiply to 6 and add to −5",
        "−2 and −3",
        "These numbers give us the factors."
      ],
      [
        "Factor the quadratic",
        "(x − 2)(x − 3) = 0",
        "Expand the brackets to recover the original equation."
      ],
      [
        "Set each factor equal to zero",
        "x = 2 or x = 3",
        "A product is zero when at least one factor is zero."
      ]
    ],
    "check": [
      "Substitute each candidate into the original equation.",
      "x = 2: 4 − 10 + 6 = 0 ✓",
      "x = 3: 9 − 15 + 6 = 0 ✓"
    ]
  },
  {
    "equation": "(x + 1) / 3 = 4",
    "answer": "x = 11",
    "detail": "One real solution. The denominator is a nonzero constant.",
    "steps": [
      [
        "Multiply both sides by 3",
        "x + 1 = 12",
        "Clear the denominator."
      ],
      [
        "Subtract 1 from both sides",
        "x = 11",
        "Isolate the unknown."
      ]
    ],
    "check": [
      "Substitute x = 11 into the original equation.",
      "(11 + 1) / 3 = 4",
      "12 / 3 = 4 ✓"
    ]
  }
];

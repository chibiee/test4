/* ==========================================================
   story.js — all words, asset paths and timing live here.
   Edit this file to change wording, pacing or file names.
   ========================================================== */
(function () {
  'use strict';
  const G = (window.FamilyLetter = window.FamilyLetter || {});

  G.story = {
    // Replace these files in the assets/ folder (or change the names here).
    assets: {
      photo: 'assets/family-photo.jpg',
      music: 'assets/solace.mp3'
    },

    // Milliseconds. Hold time per passage = baseHold + words * perWord (never below minHold).
    timing: {
      fadeIn: 1500,
      fadeOut: 1000,
      gap: 350,
      minHold: 2200,
      baseHold: 1000,
      perWord: 270,
      stagger: 1100,
      openingPause: 2600
    },

    scenes: [
      {
        id: 'opening',
        warmth: 0,
        endPause: 1800,
        passages: [
          { text: 'There are some things in life that we don’t fully understand until we grow older.' },
          { text: 'Some sacrifices we don’t notice.' },
          { text: 'Some struggles we don’t see.' },
          { text: 'Some acts of love become so familiar that we forget how extraordinary they really are.' },
          { text: 'Sometimes, we get so caught up in our own little world that we forget to stop for a moment and appreciate the people who have been there for us all along.' },
          { text: 'Today, I want to stop.' },
          { text: 'I want to take a moment to look back, to reflect, and to say the things I may not say often enough.' },
          { text: 'Because this is for the two people who mean so much to me.' },
          { lines: ['For Mama.', 'And for Ate.'], style: 'emphasis', stagger: 2200, hold: 4200 }
        ]
      },

      {
        id: 'mama',
        title: 'To Mama',
        warmth: 0,
        endPause: 2600,
        passages: [
          { text: 'Thank you.' },
          { text: 'Thank you for every sacrifice you have made, even the ones I may never fully understand.' },
          { text: 'Thank you for continuing to do what you have to do, even when life isn’t easy.' },
          { text: 'Thank you for the things you have given up, the responsibilities you have carried, and the love you have continued to give.' },
          { text: 'I know that I don’t always see everything. I know there are things you deal with that I may never completely understand.' },
          { text: 'Sometimes, I only see what is in front of me, without realizing how much effort it takes to make everything possible.' },
          { text: 'But I want you to know that I appreciate you.' },
          { text: 'I appreciate the things you do, the things you provide, and the ways you continue to care for me.' },
          { text: 'I appreciate the opportunities you have tried to give me and the future you want me to have.' },
          { text: 'And I’m sorry.' },
          { text: 'I’m sorry for the times I have acted in ways that may have hurt or disappointed you.' },
          { text: 'I’m sorry for the moments when I failed to appreciate your efforts, when I took things for granted, or when my actions did not show the gratitude I should have expressed.' },
          { text: 'You deserve to know that your sacrifices matter.' },
          { text: 'You deserve to know that I see you as more than just my mother who takes care of me.' },
          { text: 'You are a person with your own dreams, struggles, worries, and feelings. And sometimes, I may have forgotten that you need understanding and appreciation, too.' },
          { text: 'I cannot promise that I will always get everything right.' },
          { text: 'But I want to keep growing into someone who understands your sacrifices better, appreciates you more, and gives you more reasons to be proud.' },
          { text: 'Thank you for being my mom.' },
          { text: 'I may not always know how to express it, but I love you more than these words could ever fully explain.', pauseAfter: 1500 }
        ]
      },

      {
        id: 'ate',
        title: 'To Ate',
        warmth: 0,
        endPause: 2600,
        passages: [
          { text: 'Thank you for being part of my life in ways that I may not always acknowledge.' },
          { text: 'Thank you for the times you have helped me, for the things you have done for our family, and for the moments when you have been there even when I didn’t properly express how much I appreciated it.' },
          { text: 'Sometimes, we become so used to having people around us that we forget to tell them how important they are.' },
          { text: 'And I don’t want to keep doing that.' },
          { text: 'I don’t want to wait until another occasion to tell you that I’m grateful for you.' },
          { text: 'I don’t want my appreciation to remain something I only think about instead of something I actually express.' },
          { text: 'You are my sister, and that is something I will always be thankful for.' },
          { text: 'I’m sorry for the times I may have been difficult, inconsiderate, or failed to recognize the things you do.' },
          { text: 'I’m sorry for the moments when I could have shown more understanding, respect, or gratitude.' },
          { text: 'I know that saying sorry doesn’t erase the past. And saying thank you doesn’t fully repay someone for everything they have done.' },
          { text: 'But I hope these words can at least tell you something that I should have expressed more often:' },
          { text: 'I notice you. I appreciate you. And I’m grateful to have you as my Ate.', style: 'emphasis', hold: 5000 },
          { text: 'Thank you for being part of my journey, for the ways you have helped me along the way, and for being someone I can call family.' },
          { text: 'I may not always say it, but you matter to me more than you know.', pauseAfter: 1500 }
        ]
      },

      {
        id: 'shared',
        warmth: 1,
        endPause: 2200,
        passages: [
          { text: 'And to both of you…' },
          { text: 'There is something I want you to understand.' },
          { text: 'I’m still growing. I’m still learning how to become a better person. There are things I wish I had handled differently, words I wish I had said more gently, and moments when I wish I had been more understanding.' },
          { text: 'I know I still have a lot to learn.' },
          { text: 'But I don’t want to grow older and realize that I spent so much time chasing my own dreams that I forgot to appreciate the people who helped make those dreams possible.' },
          { text: 'I don’t want to become so focused on the future that I forget the people who are part of my present.' },
          { text: 'And I don’t want you to have to wonder whether I appreciate everything you have done for me.' },
          { text: 'Because I do.', style: 'emphasis' },
          { lines: ['Even when I don’t say it.', 'Even when I don’t show it properly.', 'Even when I get caught up in my own problems and forget to look beyond them.'], stagger: 1700 },
          { text: 'I am grateful.', style: 'emphasis' },
          { lines: ['For the sacrifices.', 'For the support.', 'For the opportunities.'], stagger: 1300 },
          { text: 'For the things you have done that I may never be able to repay completely.' },
          { text: 'I know that one day, I will have to stand on my own feet and build a life of my own.' },
          { text: 'I want to become someone responsible, someone who works hard for his future, and someone who can look back and know that he did his best with the opportunities he was given.' },
          { text: 'And when that day comes, I hope you will know that I never forgot where I came from.' },
          { text: 'I hope that as I grow older, my actions will begin to express what my words cannot.' },
          { text: 'I hope I can give you more reasons to smile, more reasons to feel appreciated, and more moments when you can look at me and feel that your efforts meant something.' },
          { text: 'Not because I owe you a perfect life.' },
          { text: 'But because you deserve a son and a brother who never stops trying to become a better person.' },
          { text: 'I’m sorry for the times I fell short.' },
          { text: 'Thank you for everything.' },
          { text: 'And most importantly, thank you for being my family.', style: 'emphasis', hold: 4200 }
        ]
      }
    ],

    // The finale: photo + heart of particles, then the last letter beside / below it.
    final: {
      darkPause: 3200,        // quiet darkness before anything forms
      photoDelay: 4500,       // after particles begin, before the photograph fades in
      holdBeforeLetter: 4200, // heart + photo rest alone before the letter begins
      glidePause: 3000,       // heart settles into its letter position

      letter: [
        { text: 'There are some things I want you both to know.' },
        { text: 'I know that words cannot repay every sacrifice. I know that saying thank you cannot fully express how much your efforts have meant to me.' },
        { text: 'And I know that saying sorry cannot erase the moments when I could have done better.' },
        { text: 'But I still want to say these things.' },
        { text: 'Thank you for everything you have done for me.' },
        { text: 'Thank you for the sacrifices I may never fully understand.' },
        { text: 'Thank you for the opportunities, the support, and the love that have helped me become who I am today.' },
        { text: 'I’m sorry for the times I acted poorly, for the moments when I took things for granted, and for the times I failed to show the appreciation you deserved.' },
        { text: 'I’m sorry for the times my actions did not reflect how much I care about you both.' },
        { text: 'I am still learning. I am still growing. And I know I will make mistakes along the way.' },
        { text: 'But I don’t want to stop trying to become someone who appreciates you better, understands you more, and expresses his love through his actions instead of words alone.' },
        { text: 'I hope that one day, when you look at me, you will see someone who never forgot the sacrifices you made and who continues to carry the lessons you have taught him.' },
        { text: 'I hope I can give you more reasons to smile, more reasons to feel appreciated, and more moments when you can feel that everything you have done matters.' },
        { lines: ['Mama, Ate—', 'I’m sorry for the times I didn’t show it.'], stagger: 1800 },
        { text: 'Thank you for the sacrifices I may never fully understand.' },
        { text: 'Thank you for everything.' },
        { text: 'I love you both.', style: 'emphasis', hold: 3600 },
        { text: 'And I hope that, from this moment forward, I can show you that love a little better than I did yesterday.', pauseAfter: 1200 }
      ],

      // Stays on screen. The second line arrives after a long, quiet pause.
      closing: {
        lines: [
          'No matter how far I go, I will always be grateful that I get to call you my family.',
          'This is for you. Always.'
        ],
        style: 'closing',
        stagger: 5200
      }
    }
  };
})();

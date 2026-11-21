const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMG = {
  shoeA: u("1625860191460-10a66c7384fb"),
  shoeB: u("1786379582231-f4a593cacf2d"),
  shoeC: u("1695073621086-aa692bc32a3d"),
  shoeD: u("1512374382149-233c42b6a83b"),
  shoeE: u("1728724794795-681832a6afd0"),
  headphones: u("1766338055584-5ffe426a7e57", 800),
  watch: u("1541195942158-ccbd892c4673", 800),
  earbuds: u("1588318312727-e210fcd11464", 800),
  carry: u("1523976246010-56d9a0d2ee66", 800),
};

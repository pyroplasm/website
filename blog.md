---
layout: default
title: Blog
permalink: /blog/
---

<div class="blog">
  <div class="section-header">
    <h2>Blog</h2>
    <p>Latest posts and updates</p>
  </div>
  <ul class="post-list">
    {% for post in site.posts %}
      <li>
        <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <time datetime="{{ post.date | date_to_xmlschema }}" style="margin-left:.5rem;color:#666;">{{ post.date | date: "%Y-%m-%d" }}</time>
      </li>
    {% endfor %}
  </ul>
</div>

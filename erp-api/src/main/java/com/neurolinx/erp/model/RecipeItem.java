package com.neurolinx.erp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "recipe_items")
public class RecipeItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private BigDecimal quantityRequired;

    public RecipeItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public BigDecimal getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(BigDecimal quantityRequired) { this.quantityRequired = quantityRequired; }
}

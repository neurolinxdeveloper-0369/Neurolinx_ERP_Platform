package com.neurolinx.erp.dto;

import java.math.BigDecimal;

public class CreateDishRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private String imageBase64;
    private Boolean isTodaysSpecial;
    private BigDecimal discountPercentage;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    public Boolean getIsTodaysSpecial() { return isTodaysSpecial; }
    public void setIsTodaysSpecial(Boolean isTodaysSpecial) { this.isTodaysSpecial = isTodaysSpecial; }
    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }
}
